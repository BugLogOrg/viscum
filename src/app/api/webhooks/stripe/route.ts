import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb, hasDatabase } from "@/db";
import { payments } from "@/db/schema";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe Webhook（段階C）。
 * checkout.session.completed → payments.checkout_status=paid / payout=eligible
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Stripe webhook 未設定" },
      { status: 503 },
    );
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL 未設定" }, { status: 503 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId =
      session.metadata?.paymentId ||
      session.client_reference_id ||
      undefined;
    if (!paymentId) {
      return NextResponse.json({ received: true, skipped: "no paymentId" });
    }

    const pi =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    await db
      .update(payments)
      .set({
        checkoutStatus: "paid",
        payoutStatus: "eligible",
        paidAt: new Date(),
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: pi,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId =
      session.metadata?.paymentId ||
      session.client_reference_id ||
      undefined;
    if (paymentId) {
      await db
        .update(payments)
        .set({
          checkoutStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId));
    }
  }

  return NextResponse.json({ received: true });
}
