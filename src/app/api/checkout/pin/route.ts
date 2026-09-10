import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { payments, works } from "@/db/schema";
import { isNeonWorkId } from "@/lib/neon-works";
import {
  canExtendPin,
  getPinAvailability,
} from "@/lib/pin-slots";
import {
  PIN_HOLD_MS,
  PIN_MAX_CONSECUTIVE_WEEKS,
  PIN_PRICE_YEN,
} from "@/lib/seeder-pricing";
import { appBaseUrl, getStripe, hasStripe } from "@/lib/stripe";

/**
 * 注目ピン（ADR-069）。セルフサーブ。
 * - GET  ?workId= : 空き状況＋自分のコンペの状態（ボタン表示用）
 * - POST {workId} : 空き判定 → 30分仮押さえ → Stripe Checkout ¥3,000
 * 条件: 本人／status=open／褒賞あり／公開中。同時最大3本。連続最大2週。返金なし。
 */

type PinState = {
  eligible: boolean;
  reason?: string;
  pinnedUntilIso: string | null;
  isPinned: boolean;
  canExtend: boolean;
  availability: Awaited<ReturnType<typeof getPinAvailability>>;
  priceYen: number;
};

async function loadPinState(
  workId: string,
  userId: string,
): Promise<{ state: PinState; row: typeof works.$inferSelect | null; status: number }> {
  const db = getDb();
  const availabilityFallback = await getPinAvailability({ excludeWorkId: workId });
  const empty: PinState = {
    eligible: false,
    pinnedUntilIso: null,
    isPinned: false,
    canExtend: false,
    availability: availabilityFallback,
    priceYen: PIN_PRICE_YEN,
  };
  if (!db) return { state: { ...empty, reason: "database unavailable" }, row: null, status: 503 };

  const rows = await db.select().from(works).where(eq(works.id, workId)).limit(1);
  const row = rows[0];
  if (!row) return { state: { ...empty, reason: "作品が見つかりません" }, row: null, status: 404 };
  if (row.seederId !== userId) {
    return { state: { ...empty, reason: "シーダー本人だけがピンを付けられます" }, row, status: 403 };
  }
  const now = new Date();
  const isPinned = row.pinnedUntil != null && row.pinnedUntil > now;
  const canExtend = canExtendPin(row.pinnedUntil, now);
  const base: PinState = {
    ...empty,
    pinnedUntilIso: isPinned ? row.pinnedUntil!.toISOString() : null,
    isPinned,
    canExtend,
  };
  if (!row.listedOnShelf) return { state: { ...base, reason: "公開してからピンを付けられます" }, row, status: 200 };
  if (row.status !== "open") return { state: { ...base, reason: "開催中のコンペだけです" }, row, status: 200 };
  if (!row.prizeYen || row.prizeYen <= 0 || row.plan === "free_comment") {
    return { state: { ...base, reason: "褒賞のあるコンペだけです" }, row, status: 200 };
  }
  if (isPinned && !canExtend) {
    return {
      state: { ...base, reason: `連続は最大${PIN_MAX_CONSECUTIVE_WEEKS}週までです` },
      row,
      status: 200,
    };
  }
  if (!isPinned && !availabilityFallback.canPin) {
    return { state: { ...base, reason: "今週は満席です" }, row, status: 200 };
  }
  return { state: { ...base, eligible: true }, row, status: 200 };
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id?.trim();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const workId = new URL(req.url).searchParams.get("workId")?.trim() ?? "";
  if (!isNeonWorkId(workId)) {
    return NextResponse.json({ error: "workId invalid" }, { status: 400 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  const { state, status } = await loadPinState(workId, userId);
  return NextResponse.json(state, { status: status === 200 ? 200 : status });
}

export async function POST(req: Request) {
  const session = await auth();
  const fromUserId = session?.user?.id?.trim();
  if (!fromUserId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  if (fromUserId.startsWith("demo:")) {
    return NextResponse.json(
      { error: "デモログインでは実決済できません。Magic Link または GitHub でログインしてください" },
      { status: 403 },
    );
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL 未設定" }, { status: 503 });
  }
  if (!hasStripe()) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY 未設定" }, { status: 503 });
  }
  const db = getDb();
  const stripe = getStripe();
  if (!db || !stripe) {
    return NextResponse.json({ error: "決済の準備ができません" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { workId?: string } | null;
  const workId = body?.workId?.trim() ?? "";
  if (!isNeonWorkId(workId)) {
    return NextResponse.json({ error: "workId invalid" }, { status: 400 });
  }

  const { state, row, status } = await loadPinState(workId, fromUserId);
  if (!row) return NextResponse.json({ error: state.reason ?? "not found" }, { status });
  if (status !== 200) return NextResponse.json({ error: state.reason }, { status });
  if (!state.eligible) {
    return NextResponse.json(
      {
        error: state.reason ?? "ピンを付けられません",
        nextFreeAtIso: state.availability.nextFreeAtIso,
      },
      { status: 409 },
    );
  }

  const now = new Date();
  // 仮押さえ（30分＝Checkout 有効期限）。同時押しの取り合いは webhook 側で再確認し、超過分は自動返金
  await db
    .update(works)
    .set({ pinHoldUntil: new Date(now.getTime() + PIN_HOLD_MS), updatedAt: now })
    .where(eq(works.id, workId));

  const [payment] = await db
    .insert(payments)
    .values({
      kind: "pin",
      workId,
      fromUserId,
      toUserId: null,
      amountYen: PIN_PRICE_YEN,
      feeYen: 0,
      processingYen: 0,
      checkoutStatus: "pending",
      payoutStatus: "none",
    })
    .returning({ id: payments.id });

  const base = appBaseUrl(req);
  const back = `${base}/w/${encodeURIComponent(workId)}`;
  const label = state.isPinned ? "注目ピン 1週延長" : "注目ピン（1週間）";

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "ja",
      client_reference_id: payment.id,
      expires_at: Math.floor((now.getTime() + PIN_HOLD_MS) / 1000),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "jpy",
            unit_amount: PIN_PRICE_YEN,
            product_data: {
              name: `Viscum ${label}`,
              description: `${row.title.slice(0, 80)} を「ピン」枠に7日間掲載（税込・決済込み。返金なし）`,
            },
          },
        },
      ],
      metadata: {
        paymentId: payment.id,
        workId,
        kind: "pin",
        extend: state.isPinned ? "1" : "0",
      },
      success_url: `${back}?pin=success&payment=${encodeURIComponent(payment.id)}`,
      cancel_url: `${back}?pin=cancel&payment=${encodeURIComponent(payment.id)}`,
    });

    await db
      .update(payments)
      .set({ stripeCheckoutSessionId: checkout.id, updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    if (!checkout.url) {
      return NextResponse.json({ error: "Checkout URL を取得できませんでした" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, url: checkout.url, paymentId: payment.id, priceYen: PIN_PRICE_YEN });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe エラー";
    await db
      .update(payments)
      .set({ checkoutStatus: "failed", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));
    await db.update(works).set({ pinHoldUntil: null }).where(eq(works.id, workId));
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
