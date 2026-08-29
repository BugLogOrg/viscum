import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { comments, payments } from "@/db/schema";

const NEON_COMMENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

/**
 * 投稿者本人のみ削除可。選出済み・褒賞支払い済みは不可。
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  if (!userId || !handle) {
    return NextResponse.json(
      { error: "ログインと英語IDが必要です" },
      { status: 401 },
    );
  }

  const { id: commentId } = await ctx.params;
  const workId = new URL(req.url).searchParams.get("workId")?.trim() ?? "";
  if (!commentId || !NEON_COMMENT_ID.test(commentId)) {
    return NextResponse.json({ error: "commentId が不正です" }, { status: 400 });
  }
  if (!workId) {
    return NextResponse.json({ error: "workId required" }, { status: 400 });
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
      id: comments.id,
      workId: comments.workId,
      authorId: comments.authorId,
      adoptedAt: comments.adoptedAt,
    })
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.workId, workId)))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "コメントが見つかりません" }, { status: 404 });
  }
  if (row.authorId !== userId) {
    return NextResponse.json(
      { error: "自分のコメントだけ削除できます" },
      { status: 403 },
    );
  }
  if (row.adoptedAt) {
    return NextResponse.json(
      { error: "選出済みのコメントは削除できません" },
      { status: 400 },
    );
  }

  const paid = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.commentId, commentId),
        eq(payments.checkoutStatus, "paid"),
      ),
    )
    .limit(1);
  if (paid[0]) {
    return NextResponse.json(
      { error: "褒賞支払い済みのコメントは削除できません" },
      { status: 400 },
    );
  }

  await db.delete(comments).where(eq(comments.id, commentId));
  return NextResponse.json({ ok: true, deleted: true });
}
