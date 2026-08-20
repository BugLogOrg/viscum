import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { payments } from "@/db/schema";
import { getStripe, hasStripe } from "@/lib/stripe";

/**
 * Checkout 成功戻り用の保険。
 * Webhook がまだ無い／遅延時に、session を Stripe から再確認して paid にする。
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  if (!hasDatabase() || !hasStripe()) {
    return NextResponse.json({ error: "未設定" }, { status: 503 });
  }

  const db = getDb();
  const stripe = getStripe();
  if (!db || !stripe) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as {
    paymentId?: string;
  } | null;
  const paymentId = body?.paymentId?.trim();
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  const payment = rows[0];
  if (!payment) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (payment.fromUserId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (payment.checkoutStatus === "paid") {
    return NextResponse.json({ ok: true, status: "paid" });
  }
  if (!payment.stripeCheckoutSessionId) {
    return NextResponse.json({ error: "session missing" }, { status: 400 });
  }

  const checkout = await stripe.checkout.sessions.retrieve(
    payment.stripeCheckoutSessionId,
  );
  if (checkout.payment_status !== "paid") {
    return NextResponse.json({
      ok: true,
      status: payment.checkoutStatus,
      stripe: checkout.payment_status,
    });
  }

  const pi =
    typeof checkout.payment_intent === "string"
      ? checkout.payment_intent
      : checkout.payment_intent?.id ?? null;

  await db
    .update(payments)
    .set({
      checkoutStatus: "paid",
      payoutStatus: "eligible",
      paidAt: new Date(),
      stripePaymentIntentId: pi,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));

  return NextResponse.json({ ok: true, status: "paid" });
}
