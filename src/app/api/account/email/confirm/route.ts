import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { users, verificationTokens } from "@/db/schema";

/** メール変更リンクの着地。ログイン中ユーザーのみ。 */
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "https://viscum.vercel.app";
  const settings = `${origin}/dashboard/settings`;

  if (!userId || userId.startsWith("demo:")) {
    return NextResponse.redirect(
      `${origin}/login?callbackUrl=${encodeURIComponent("/dashboard/settings")}`,
    );
  }
  if (!hasDatabase()) {
    return NextResponse.redirect(`${settings}?email=error`);
  }

  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(`${settings}?email=invalid`);
  }

  const db = getDb();
  if (!db) {
    return NextResponse.redirect(`${settings}?email=error`);
  }

  const identifier = `email-change:${userId}`;
  const rows = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  const row = rows.find((r) => r.token.startsWith(`${token}:`));
  if (!row || row.expires.getTime() < Date.now()) {
    return NextResponse.redirect(`${settings}?email=expired`);
  }

  const email = row.token.slice(token.length + 1).toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.redirect(`${settings}?email=invalid`);
  }

  const taken = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (taken[0] && taken[0].id !== userId) {
    return NextResponse.redirect(`${settings}?email=taken`);
  }

  await db
    .update(users)
    .set({ email, emailVerified: new Date() })
    .where(eq(users.id, userId));
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  return NextResponse.redirect(`${settings}?email=ok`);
}
