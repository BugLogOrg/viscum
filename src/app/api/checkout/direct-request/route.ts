import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { payments, requestDms, users } from "@/db/schema";
import { estimateSeederPaysYen } from "@/lib/local-request-dms";
import {
  appBaseUrl,
  getStripe,
  hasStripe,
  MIN_ADOPT_YEN,
} from "@/lib/stripe";

/**
 * 直依頼・完了承認 → Stripe Checkout（段階C・入金のみ）。
 * 請求額 = 褒賞額面 × 約1.10（ADR-039）。payments.amountYen は額面（層B用）。
 */
export async function POST(req: Request) {
  const session = await auth();
  const fromUserId = session?.user?.id;
  if (!fromUserId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  if (fromUserId.startsWith("demo:")) {
    return NextResponse.json(
      {
        error:
          "デモログインでは実決済できません。Magic Link または GitHub でログインしてください",
      },
      { status: 403 },
    );
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL 未設定" }, { status: 503 });
  }
  if (!hasStripe()) {
    return NextResponse.json(
      {
        error:
          "STRIPE_SECRET_KEY 未設定（Stripe Dashboard のテスト鍵を入れてください）",
      },
      { status: 503 },
    );
  }

  const db = getDb();
  const stripe = getStripe();
  if (!db || !stripe) {
    return NextResponse.json({ error: "決済の準備ができません" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as {
    requestId?: string;
  } | null;
  const requestId = body?.requestId?.trim() ?? "";
  if (!requestId) {
    return NextResponse.json({ error: "requestId required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(requestDms)
    .where(eq(requestDms.id, requestId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "依頼が見つかりません" }, { status: 404 });
  }
  if (row.fromUserId !== fromUserId) {
    return NextResponse.json(
      { error: "依頼主だけが支払いできます" },
      { status: 403 },
    );
  }
  if (row.status !== "pay_waiting") {
    return NextResponse.json(
      { error: "支払待ちのときだけ完了払いできます" },
      { status: 400 },
    );
  }
  if (!row.toUserId) {
    return NextResponse.json(
      { error: "受け手がまだ割り当てられていません" },
      { status: 400 },
    );
  }

  const mentorYen = Math.max(0, Math.round(row.amountYen));
  if (mentorYen <= 0) {
    return NextResponse.json(
      { error: "無料の依頼は Checkout 不要です。完了承認だけで進めます" },
      { status: 400 },
    );
  }
  if (mentorYen < MIN_ADOPT_YEN) {
    return NextResponse.json(
      { error: `有料は¥${MIN_ADOPT_YEN.toLocaleString()}以上です` },
      { status: 400 },
    );
  }

  const { seederPaysYen } = estimateSeederPaysYen(mentorYen);

  const alreadyPaid = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.requestId, requestId),
        eq(payments.checkoutStatus, "paid"),
      ),
    )
    .limit(1);
  if (alreadyPaid[0]) {
    return NextResponse.json(
      { error: "この依頼は支払い済みです" },
      { status: 409 },
    );
  }

  const payer = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, fromUserId))
    .limit(1);
  if (!payer[0]) {
    return NextResponse.json(
      { error: "ユーザーがDBにありません。再ログインしてください" },
      { status: 400 },
    );
  }

  const [payment] = await db
    .insert(payments)
    .values({
      kind: "direct_request",
      workId: row.workId,
      requestId,
      fromUserId,
      toUserId: row.toUserId,
      amountYen: mentorYen,
      checkoutStatus: "pending",
      payoutStatus: "none",
    })
    .returning({ id: payments.id });

  const base = appBaseUrl(req);
  const successUrl = `${base}/dashboard/messages/${encodeURIComponent(requestId)}?checkout=success&payment=${encodeURIComponent(payment.id)}`;
  const cancelUrl = `${base}/dashboard/messages/${encodeURIComponent(requestId)}?checkout=cancel&payment=${encodeURIComponent(payment.id)}`;

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "ja",
      client_reference_id: payment.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "jpy",
            unit_amount: seederPaysYen,
            product_data: {
              name: "Viscum 直依頼・完了払い",
              description: `${row.workTitle.slice(0, 80)}（褒賞¥${mentorYen.toLocaleString()}＋約10%決済込み）`,
            },
          },
        },
      ],
      metadata: {
        paymentId: payment.id,
        requestId,
        kind: "direct_request",
        mentorYen: String(mentorYen),
        seederPaysYen: String(seederPaysYen),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    await db
      .update(payments)
      .set({
        stripeCheckoutSessionId: checkout.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    if (!checkout.url) {
      return NextResponse.json(
        { error: "Checkout URL を取得できませんでした" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      url: checkout.url,
      paymentId: payment.id,
      mentorYen,
      seederPaysYen,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe エラー";
    await db
      .update(payments)
      .set({ checkoutStatus: "failed", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
