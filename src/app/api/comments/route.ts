import { NextResponse } from "next/server";
import { desc, eq, inArray, and } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { comments, payments, users } from "@/db/schema";
import type { Comment } from "@/data/dummy-works";
import { isCommentAttitudeId } from "@/lib/protocol-colors";

function hoursAgoFrom(date: Date): number {
  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (60 * 60 * 1000)),
  );
}

function toClientComment(
  row: {
    id: string;
    subject: string;
    body: string;
    imageUrls: string[] | null;
    adoptedAt: Date | null;
    afterClose: boolean;
    attitude: string | null;
    createdAt: Date;
    handle: string | null;
    name: string | null;
  },
  paid?: { tipped: boolean; tipYen?: number },
): Comment {
  const handle = (row.handle ?? "").replace(/^@/, "").trim() || "unknown";
  const name = row.name?.trim();
  return {
    id: row.id,
    author: handle,
    accountName:
      name && name.toLowerCase() !== handle.toLowerCase() ? name : undefined,
    subject: row.subject,
    body: row.body,
    imageUrls: row.imageUrls?.length ? row.imageUrls : undefined,
    hoursAgo: hoursAgoFrom(row.createdAt),
    adopted: Boolean(row.adoptedAt) || Boolean(paid?.tipped),
    tipped: paid?.tipped || undefined,
    tipYen: paid?.tipYen,
    afterClose: row.afterClose || undefined,
    attitude: isCommentAttitudeId(row.attitude) ? row.attitude : undefined,
  };
}

/** 作品のコメント一覧（新しい順）。支払い済みは payments から合成 */
export async function GET(req: Request) {
  const workId = new URL(req.url).searchParams.get("workId")?.trim();
  if (!workId) {
    return NextResponse.json({ error: "workId required" }, { status: 400 });
  }

  if (!hasDatabase()) {
    return NextResponse.json({ comments: [] as Comment[], persisted: false });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ comments: [] as Comment[], persisted: false });
  }

  const rows = await db
    .select({
      id: comments.id,
      subject: comments.subject,
      body: comments.body,
      imageUrls: comments.imageUrls,
      adoptedAt: comments.adoptedAt,
      afterClose: comments.afterClose,
      attitude: comments.attitude,
      createdAt: comments.createdAt,
      handle: users.handle,
      name: users.name,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.workId, workId))
    .orderBy(desc(comments.createdAt))
    .limit(80);

  const ids = rows.map((r) => r.id);
  const paidMap = new Map<string, { tipped: boolean; tipYen: number }>();
  if (ids.length > 0) {
    const paidRows = await db
      .select({
        commentId: payments.commentId,
        amountYen: payments.amountYen,
      })
      .from(payments)
      .where(
        and(
          eq(payments.checkoutStatus, "paid"),
          inArray(payments.commentId, ids),
        ),
      );
    for (const p of paidRows) {
      if (p.commentId) {
        paidMap.set(p.commentId, { tipped: true, tipYen: p.amountYen });
      }
    }
  }

  return NextResponse.json({
    comments: rows.map((r) =>
      toClientComment(r, paidMap.get(r.id)),
    ),
    persisted: true,
  });
}

/** ログイン＋英語ID必須で投稿 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  if (!userId || !handle) {
    return NextResponse.json(
      { error: "ログインと英語IDが必要です" },
      { status: 401 },
    );
  }

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "DATABASE_URL 未設定のため保存できません" },
      { status: 503 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as {
    workId?: string;
    subject?: string;
    body?: string;
    imageUrls?: string[];
    afterClose?: boolean;
    attitude?: string;
  } | null;

  const workId = body?.workId?.trim();
  const subject = body?.subject?.trim().slice(0, 80) ?? "";
  const text = body?.body?.trim().slice(0, 12000) ?? "";
  const attitude = isCommentAttitudeId(body?.attitude) ? body.attitude : null;
  const imageUrls = Array.isArray(body?.imageUrls)
    ? body.imageUrls
        .filter((u) => typeof u === "string" && u.length > 0)
        .slice(0, 6)
    : [];

  if (!workId) {
    return NextResponse.json({ error: "workId required" }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json({ error: "件名が必要です" }, { status: 400 });
  }
  if (!attitude) {
    return NextResponse.json(
      { error: "コメントの態度（緑／青／赤）を選んでください" },
      { status: 400 },
    );
  }
  if (!text && imageUrls.length === 0) {
    return NextResponse.json(
      { error: "本文か画像が必要です" },
      { status: 400 },
    );
  }

  const authorRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!authorRows[0]) {
    return NextResponse.json(
      { error: "ユーザーがDBにありません。再ログインしてください" },
      { status: 400 },
    );
  }

  const [inserted] = await db
    .insert(comments)
    .values({
      workId,
      authorId: userId,
      subject,
      body: text || "（画像のみ）",
      imageUrls,
      afterClose: Boolean(body?.afterClose),
      attitude,
    })
    .returning({
      id: comments.id,
      subject: comments.subject,
      body: comments.body,
      imageUrls: comments.imageUrls,
      adoptedAt: comments.adoptedAt,
      afterClose: comments.afterClose,
      attitude: comments.attitude,
      createdAt: comments.createdAt,
    });

  const accountName =
    session.user?.name?.trim() &&
    session.user.name.trim().toLowerCase() !== handle.toLowerCase()
      ? session.user.name.trim()
      : null;

  const comment = toClientComment({
    ...inserted,
    imageUrls: inserted.imageUrls,
    handle,
    name: accountName,
  });

  return NextResponse.json({ comment, persisted: true });
}
