import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { payments, requestDms } from "@/db/schema";

/**
 * Checkout 完了後の共通処理。
 * payments を paid にし、直依頼なら request_dms も paid へ。
 */
export async function markPaymentPaid(input: {
  paymentId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}): Promise<{ ok: boolean; requestId?: string | null }> {
  const db = getDb();
  if (!db) return { ok: false };

  const rows = await db
    .select({
      id: payments.id,
      kind: payments.kind,
      requestId: payments.requestId,
      checkoutStatus: payments.checkoutStatus,
    })
    .from(payments)
    .where(eq(payments.id, input.paymentId))
    .limit(1);
  const payment = rows[0];
  if (!payment) return { ok: false };

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
