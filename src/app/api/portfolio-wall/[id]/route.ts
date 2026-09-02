import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { portfolioWallPosts } from "@/db/schema";

const NEON_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

/** 書き込み主本人のみ削除可 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  if (!userId || !handle) {
    return NextResponse.json(
      { error: "ログインと英語IDが必要です" },
      { status: 401 },
    );
  }

  const { id: postId } = await ctx.params;
  if (!postId || !NEON_ID.test(postId)) {
    return NextResponse.json({ error: "投稿IDが不正です" }, { status: 400 });
  }

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "DATABASE_URL 未設定のため削除できません" },
      { status: 503 },
    );
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  const rows = await db
    .select({
      id: portfolioWallPosts.id,
      authorId: portfolioWallPosts.authorId,
    })
    .from(portfolioWallPosts)
    .where(eq(portfolioWallPosts.id, postId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json(
      { error: "コメントが見つかりません" },
      { status: 404 },
    );
  }
  if (row.authorId !== userId) {
    return NextResponse.json(
      { error: "自分の書き込みだけ削除できます" },
      { status: 403 },
    );
  }

  await db.delete(portfolioWallPosts).where(eq(portfolioWallPosts.id, postId));
  return NextResponse.json({ ok: true, deleted: true });
}
