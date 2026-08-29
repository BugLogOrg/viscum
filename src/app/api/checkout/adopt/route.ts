import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { comments, payments, users } from "@/db/schema";
import {
  appBaseUrl,
  clampAdoptYen,
  getStripe,
  hasStripe,
  MIN_ADOPT_YEN,
} from "@/lib/stripe";

const NEON_COMMENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 採用＋Stripe Checkout（段階C・入金のみ）。
 * Connect 出金は後段。成功時 payout_status=eligible。
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
      { error: "STRIPE_SECRET_KEY 未設定（Stripe Dashboard のテスト鍵を入れてください）" },
      { status: 503 },
    );
  }

  const db = getDb();
  const stripe = getStripe();
  if (!db || !stripe) {
    return NextResponse.json({ error: "決済の準備ができません" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as {
    commentId?: string;
    workId?: string;
    amountYen?: number;
  } | null;

  const commentId = body?.commentId?.trim() ?? "";
  const workId = body?.workId?.trim() ?? "";
  const amountYen = clampAdoptYen(body?.amountYen);

  if (!commentId || !NEON_COMMENT_ID.test(commentId)) {
    return NextResponse.json(
      {
        error:
          "Neonに保存されたコメントだけ実決済できます（デモ初期コメントは対象外）",
      },
      { status: 400 },
    );
  }
  if (!workId) {
    return NextResponse.json({ error: "workId required" }, { status: 400 });
  }
  if (amountYen < MIN_ADOPT_YEN) {
    return NextResponse.json(
      { error: `金額は¥${MIN_ADOPT_YEN.toLocaleString()}以上です` },
      { status: 400 },
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

  const commentRows = await db
    .select({
      id: comments.id,
      workId: comments.workId,
      authorId: comments.authorId,
      afterClose: comments.afterClose,
      subject: comments.subject,
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  const comment = commentRows[0];
  if (!comment) {
    return NextResponse.json({ error: "コメントが見つかりません" }, { status: 404 });
  }
  if (comment.workId !== workId) {
    return NextResponse.json({ error: "作品とコメントが一致しません" }, { status: 400 });
  }
  if (comment.afterClose) {
    return NextResponse.json(
      { error: "終了後コメントは賞金対象外です" },
      { status: 400 },
    );
  }
  if (comment.authorId === fromUserId) {
    return NextResponse.json(
      { error: "自分のコメントには支払えません" },
      { status: 400 },
    );
  }

  const alreadyPaid = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.commentId, commentId),
        eq(payments.checkoutStatus, "paid"),
      ),
    )
    .limit(1);
  if (alreadyPaid[0]) {
    return NextResponse.json(
      { error: "このコメントは支払い済みです" },
      { status: 409 },
    );
  }

  // 採用マーク
  await db
    .update(comments)
    .set({ adoptedAt: new Date() })
    .where(eq(comments.id, commentId));

  // 未完了セッションがあれば再利用せず新規（古い pending は残してよい）
  const [payment] = await db
    .insert(payments)
    .values({
      kind: "field_adopt",
      workId,
      commentId,
      fromUserId,
      toUserId: comment.authorId,
      amountYen,
      checkoutStatus: "pending",
      payoutStatus: "none",
    })
    .returning({ id: payments.id });

  const base = appBaseUrl(req);
  const successUrl = `${base}/w/${encodeURIComponent(workId)}?checkout=success&payment=${encodeURIComponent(payment.id)}`;
  const cancelUrl = `${base}/w/${encodeURIComponent(workId)}?checkout=cancel&payment=${encodeURIComponent(payment.id)}`;

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
            unit_amount: amountYen,
            product_data: {
              name: "Viscum 褒賞",
              description: comment.subject.slice(0, 120),
            },
          },
        },
      ],
      metadata: {
        paymentId: payment.id,
        commentId,
        workId,
        kind: "field_adopt",
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
      amountYen,
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
