import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { accounts, users, verificationTokens, works } from "@/db/schema";

/**
 * ログイン中ユーザーのアカウント削除。
 * works.seeder_id に cascade がないため、先に作品を消してから users を消す。
 */
export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // デモログインは端末側掃除＋signOut で足りる（共有ダミー人物を消さない）
  if (userId.startsWith("demo:")) {
    return NextResponse.json({ ok: true, demo: true, persisted: false });
  }

  if (!hasDatabase()) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const rows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    // セッションだけ残っている場合もクライアント側で抜けられるように ok
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    await db.delete(works).where(eq(works.seederId, userId));
    await db.delete(accounts).where(eq(accounts.userId, userId));
    if (row.email) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, row.email));
    }
    await db.delete(users).where(and(eq(users.id, userId)));
  } catch (e) {
    console.error("[DELETE /api/account]", e);
    return NextResponse.json(
      { error: "削除に失敗しました。しばらくしてから再度お試しください。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
