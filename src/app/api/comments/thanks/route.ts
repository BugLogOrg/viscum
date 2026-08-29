import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { comments } from "@/db/schema";

const NEON_COMMENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function norm(h: string) {
  return h.replace(/^@/, "").trim().toLowerCase();
}

/**
 * シーダーがメンターコメントへ無料お礼（ワンタップ）。
 * 結果は thanked_at。自分のコメント・非シーダーは不可。
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const myHandle = norm(session?.user?.handle ?? "");
  if (!userId || !myHandle) {
    return NextResponse.json(
      { error: "ログインと英語IDが必要です" },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    commentId?: string;
    workId?: string;
    seederHandle?: string;
  } | null;

  const commentId = body?.commentId?.trim() ?? "";
  const workId = body?.workId?.trim() ?? "";
  const seederHandle = norm(body?.seederHandle ?? "");

  if (!commentId || !workId) {
    return NextResponse.json(
      { error: "commentId と workId が必要です" },
      { status: 400 },
    );
  }
  if (!seederHandle || seederHandle !== myHandle) {
    return NextResponse.json(
      { error: "お礼は作品シーダー本人だけができます" },
      { status: 403 },
    );
  }

  if (!NEON_COMMENT_ID.test(commentId)) {
    // デモ／ローカルコメントはクライアント側 localStorage で足りる
    return NextResponse.json({ ok: true, persisted: false, thanked: true });
  }

  if (!hasDatabase()) {
    return NextResponse.json({ ok: true, persisted: false, thanked: true });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false, thanked: true });
  }

  const rows = await db
    .select({
      id: comments.id,
      workId: comments.workId,
      authorId: comments.authorId,
      thankedAt: comments.thankedAt,
    })
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.workId, workId)))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "コメントが見つかりません" }, { status: 404 });
  }
  if (row.authorId === userId) {
    return NextResponse.json(
      { error: "自分のコメントにはお礼できません" },
      { status: 400 },
    );
  }
  if (row.thankedAt) {
    return NextResponse.json({ ok: true, persisted: true, thanked: true });
  }

  try {
    await db
      .update(comments)
      .set({ thankedAt: new Date() })
      .where(eq(comments.id, commentId));
  } catch {
    // カラム未適用時は端末側お礼にフォールバック
    return NextResponse.json({ ok: true, persisted: false, thanked: true });
  }

  return NextResponse.json({ ok: true, persisted: true, thanked: true });
}
