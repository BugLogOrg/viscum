import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { payments, requestDms, works } from "@/db/schema";
import {
  applyPinPurchase,
  canExtendPin,
  getPinAvailability,
  releasePinHold,
} from "@/lib/pin-slots";
import { getStripe } from "@/lib/stripe";

/**
 * Checkout 完了後の共通処理。
 * payments を paid にし、直依頼なら request_dms も paid へ。
 * pin（ADR-069）は works.pinned_until を延ばす。満席なら自動返金。
 */
export async function markPaymentPaid(input: {
  paymentId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}): Promise<{
  ok: boolean;
  requestId?: string | null;
  pin?: { pinnedUntilIso: string | null; refunded: boolean };
}> {
  const db = getDb();
  if (!db) return { ok: false };

  const rows = await db
    .select({
      id: payments.id,
      kind: payments.kind,
      workId: payments.workId,
      requestId: payments.requestId,
      checkoutStatus: payments.checkoutStatus,
      stripePaymentIntentId: payments.stripePaymentIntentId,
    })
    .from(payments)
    .where(eq(payments.id, input.paymentId))
    .limit(1);
  const payment = rows[0];
  if (!payment) return { ok: false };

  if (payment.kind === "pin") {
    return markPinPaid(payment, input);
  }

  if (payment.checkoutStatus !== "paid") {
    await db
      .update(payments)
      .set({
        checkoutStatus: "paid",
        payoutStatus: "eligible",
        paidAt: new Date(),
        ...(input.stripeCheckoutSessionId
          ? { stripeCheckoutSessionId: input.stripeCheckoutSessionId }
          : {}),
        ...(input.stripePaymentIntentId
          ? { stripePaymentIntentId: input.stripePaymentIntentId }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));
  }

  if (payment.kind === "direct_request" && payment.requestId) {
    const reqRows = await db
      .select({
        id: requestDms.id,
        status: requestDms.status,
        messages: requestDms.messages,
        toUserId: requestDms.toUserId,
        workId: requestDms.workId,
        workTitle: requestDms.workTitle,
        amountYen: requestDms.amountYen,
      })
      .from(requestDms)
      .where(eq(requestDms.id, payment.requestId))
      .limit(1);
    const req = reqRows[0];
    if (req && req.status !== "paid" && req.status !== "declined" && req.status !== "closed") {
      const note = {
        id: crypto.randomUUID(),
        fromHandle: "system",
        body: "完了承認・お支払いが完了しました（支払済）。",
        createdAt: new Date().toISOString(),
      };
      await db
        .update(requestDms)
        .set({
          status: "paid",
          messages: [...(req.messages ?? []), note],
          updatedAt: new Date(),
        })
        .where(eq(requestDms.id, req.id));
      if (req.toUserId) {
        try {
          const { notifyMentorRequestPaid } = await import(
            "@/lib/notify-request-paid"
          );
          await notifyMentorRequestPaid({
            mentorUserId: req.toUserId,
            requestId: req.id,
            workId: req.workId,
            workTitle: req.workTitle,
            amountYen: req.amountYen,
          });
        } catch {
          // 通知失敗でも支払済は成立
        }
      }
    }
    return { ok: true, requestId: payment.requestId };
  }

  return { ok: true, requestId: payment.requestId };
}

/**
 * ピン購入の確定。
 * - 既に paid／refunded なら何もしない（webhook と sync の二重呼び）
 * - 自分が有効ピン中（延長）なら空き判定を飛ばして +7d
 * - 新規なら再度空きを数え、満席なら Stripe で全額返金して refunded
 */
async function markPinPaid(
  payment: {
    id: string;
    workId: string | null;
    checkoutStatus: string;
    stripePaymentIntentId: string | null;
  },
  input: {
    stripeCheckoutSessionId?: string | null;
    stripePaymentIntentId?: string | null;
  },
): Promise<{
  ok: boolean;
  requestId?: string | null;
  pin?: { pinnedUntilIso: string | null; refunded: boolean };
}> {
  const db = getDb();
  if (!db) return { ok: false };
  if (payment.checkoutStatus === "paid" || payment.checkoutStatus === "refunded") {
    return { ok: true, requestId: null };
  }
  const workId = payment.workId;
  if (!workId) return { ok: false };

  const stripeIds = {
    ...(input.stripeCheckoutSessionId
      ? { stripeCheckoutSessionId: input.stripeCheckoutSessionId }
      : {}),
    ...(input.stripePaymentIntentId
      ? { stripePaymentIntentId: input.stripePaymentIntentId }
      : {}),
  };

  const wrows = await db
    .select({ pinnedUntil: works.pinnedUntil, status: works.status })
    .from(works)
    .where(eq(works.id, workId))
    .limit(1);
  const w = wrows[0];
  const now = new Date();
  const extending = Boolean(w?.pinnedUntil && w.pinnedUntil > now);
  const extendOk = extending && canExtendPin(w?.pinnedUntil ?? null, now);

  let fits = true;
  if (!extending) {
    const avail = await getPinAvailability({ excludeWorkId: workId });
    fits = avail.active < avail.max;
  } else if (!extendOk) {
    fits = false;
  }

  if (!fits) {
    const pi = input.stripePaymentIntentId ?? payment.stripePaymentIntentId;
    const stripe = getStripe();
    let refunded = false;
    if (stripe && pi) {
      try {
        await stripe.refunds.create({ payment_intent: pi });
        refunded = true;
      } catch (e) {
        console.error("[pin] refund failed", payment.id, e);
      }
    }
    await db
      .update(payments)
      .set({
        checkoutStatus: refunded ? "refunded" : "paid",
        payoutStatus: "none",
        paidAt: now,
        ...stripeIds,
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id));
    await releasePinHold(workId);
    // 返金できなかった場合は paid のまま残す（手動で対応。pinned_until は延ばさない）
    return { ok: true, requestId: null, pin: { pinnedUntilIso: null, refunded } };
  }

  const next = await applyPinPurchase(workId);
  await db
    .update(payments)
    .set({
      checkoutStatus: "paid",
      payoutStatus: "none",
      paidAt: now,
      ...stripeIds,
      updatedAt: now,
    })
    .where(eq(payments.id, payment.id));
  return {
    ok: true,
    requestId: null,
    pin: { pinnedUntilIso: next ? next.toISOString() : null, refunded: false },
  };
}

/** Checkout 期限切れ／失敗時：ピンなら仮押さえを解く */
export async function releasePaymentHold(paymentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const rows = await db
    .select({ kind: payments.kind, workId: payments.workId })
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  const p = rows[0];
  if (p?.kind === "pin" && p.workId) {
    await releasePinHold(p.workId);
  }
}
