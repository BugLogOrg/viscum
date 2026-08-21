import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { users, verificationTokens } from "@/db/schema";

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** いまのログインメール（DB優先） */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDatabase() || userId.startsWith("demo:")) {
    return NextResponse.json({
      email: session.user.email ?? null,
      demo: userId.startsWith("demo:"),
    });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ email: session.user.email ?? null });
  }
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return NextResponse.json({
    email: rows[0]?.email ?? session.user.email ?? null,
    demo: false,
  });
}

/** ログイン中ユーザーのメール変更を依頼（確認リンク送信） */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (userId.startsWith("demo:")) {
    return NextResponse.json(
      {
        error: "demo",
        message:
          "デモログインではメールを変更できません。本番ログインで使ってください。",
      },
      { status: 400 },
    );
  }
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "no_db", message: "データベース未接続のため変更できません" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "invalid", message: "メールアドレスの形式を確認してください" },
      { status: 400 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "no_db" }, { status: 503 });
  }

  const taken = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (taken[0] && taken[0].id !== userId) {
    return NextResponse.json(
      {
        error: "taken",
        message: "このメールは別のアカウントで使われています",
      },
      { status: 409 },
    );
  }

  const me = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (me[0]?.email && normalizeEmail(me[0].email) === email) {
    return NextResponse.json(
      { error: "same", message: "いまのメールと同じです" },
      { status: 400 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom =
    process.env.EMAIL_FROM_ADDRESS?.trim() || "noreply@mail.viscum.org";
  if (!resendKey) {
    return NextResponse.json(
      { error: "no_mail", message: "メール送信が準備できていません" },
      { status: 503 },
    );
  }

  const token = randomBytes(32).toString("hex");
  const identifier = `email-change:${userId}`;
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));
  await db.insert(verificationTokens).values({
    identifier,
    token: `${token}:${email}`,
    expires,
  });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "https://viscum.vercel.app";
  const confirmUrl = `${origin}/api/account/email/confirm?token=${encodeURIComponent(token)}`;

  const send = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `VISCUM <${emailFrom}>`,
      to: [email],
      subject: "【VISCUM】メールアドレス変更の確認",
      text: [
        "VISCUM のログイン用メール変更の確認です。",
        "",
        "次のリンクを開くと、このアドレスに切り替わります。",
        confirmUrl,
        "",
        "心当たりがない場合は無視してください（1時間で無効）。",
      ].join("\n"),
      html: `
        <p>VISCUM のログイン用メール変更の確認です。</p>
        <p><a href="${confirmUrl}">このメールアドレスに変更する</a></p>
        <p style="color:#666;font-size:12px">心当たりがない場合は無視してください（1時間で無効）。</p>
      `,
    }),
  });

  if (!send.ok) {
    return NextResponse.json(
      { error: "send_failed", message: "確認メールを送れませんでした" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sentTo: email });
}
