import { NextResponse } from "next/server";
import { desc, eq, inArray, and } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { listFollowerUserIds } from "@/db/follows";
import { createNotificationsForUsers } from "@/db/notifications";
import { comments, payments, users, works } from "@/db/schema";
import type { Comment } from "@/data/dummy-works";
import { isNeonWorkId } from "@/lib/neon-works";
import { isCommentAttitudeId } from "@/lib/protocol-colors";
import {
  notifyCommentReply,
  notifySeedNewComment,
  notifySeedReplyActivity,
} from "@/lib/notify-work-comment";

const NEON_COMMENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hoursAgoFrom(date: Date): number {
  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (60 * 60 * 1000)),
  );
}

function toClientComment(
  row: {
    id: string;
    parentId: string | null;
    subject: string;
    body: string;
    imageUrls: string[] | null;
    adoptedAt: Date | null;
    thankedAt: Date | null;
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
    parentId: row.parentId ?? undefined,
    author: handle,
    accountName:
      name && name.toLowerCase() !== handle.toLowerCase() ? name : undefined,
    subject: row.subject,
    body: row.body,
    imageUrls: row.imageUrls?.length ? row.imageUrls : undefined,
    hoursAgo: hoursAgoFrom(row.createdAt),
    createdAtIso: row.createdAt.toISOString(),
    adopted: Boolean(row.adoptedAt) || Boolean(paid?.tipped),
    thanked: Boolean(row.thankedAt) || undefined,
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
      parentId: comments.parentId,
      subject: comments.subject,
      body: comments.body,
      imageUrls: comments.imageUrls,
      adoptedAt: comments.adoptedAt,
      thankedAt: comments.thankedAt,
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
    .limit(120);

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

/** ログイン＋英語ID必須で投稿。parentId あり＝1段返信（ADR-027） */
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
    parentId?: string;
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
  const rawParentId = body?.parentId?.trim() ?? "";

  if (!workId) {
    return NextResponse.json({ error: "workId required" }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json({ error: "件名が必要です" }, { status: 400 });
  }

  let parentId: string | null = null;
  let parentAuthorId: string | null = null;
  if (rawParentId) {
    if (!NEON_COMMENT_ID.test(rawParentId)) {
      return NextResponse.json(
        { error: "返信先コメントが不正です" },
        { status: 400 },
      );
    }
    const parentRows = await db
      .select({
        id: comments.id,
        workId: comments.workId,
        parentId: comments.parentId,
        authorId: comments.authorId,
      })
      .from(comments)
      .where(eq(comments.id, rawParentId))
      .limit(1);
    const parent = parentRows[0];
    if (!parent || parent.workId !== workId) {
      return NextResponse.json(
        { error: "返信先コメントが見つかりません" },
        { status: 404 },
      );
    }
    // 直近の返信先を保持（引用表示用）。一覧はルート直下にフラット表示（ADR-027）
    parentId = parent.id;
    parentAuthorId = parent.authorId;
  }

  const isReply = Boolean(parentId);
  // 返信は地の文章のみ（態度・画像なし）。ルートは態度必須
  if (!isReply && !attitude) {
    return NextResponse.json(
      { error: "コメントの態度（賛同／止まれ／別軸）を選んでください" },
      { status: 400 },
    );
  }
  if (isReply) {
    if (!text) {
      return NextResponse.json({ error: "返信本文が必要です" }, { status: 400 });
    }
  } else if (!text && imageUrls.length === 0) {
    return NextResponse.json(
      { error: "本文か画像が必要です" },
      { status: 400 },
    );
  }

  const savedImageUrls = isReply ? [] : imageUrls;
  const savedAttitude = isReply ? null : attitude;

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
      parentId,
      subject,
      body: text || "（画像のみ）",
      imageUrls: savedImageUrls,
      afterClose: Boolean(body?.afterClose),
      attitude: savedAttitude,
    })
    .returning({
      id: comments.id,
      parentId: comments.parentId,
      subject: comments.subject,
      body: comments.body,
      imageUrls: comments.imageUrls,
      adoptedAt: comments.adoptedAt,
      thankedAt: comments.thankedAt,
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

  // 通知: 返信→親著者／ルート→シーダー／返信でもシーダー（重複除外）／ルートのみフォロワー
  try {
    let seederId: string | null = null;
    let workTitle = "";
    if (isNeonWorkId(workId)) {
      const wrows = await db
        .select({ seederId: works.seederId, title: works.title })
        .from(works)
        .where(eq(works.id, workId))
        .limit(1);
      seederId = wrows[0]?.seederId ?? null;
      workTitle = wrows[0]?.title?.trim() ?? "";
    }

    const notified = new Set<string>();

    if (parentId && parentAuthorId && parentAuthorId !== userId) {
      await notifyCommentReply({
        toUserId: parentAuthorId,
        workId,
        commentId: inserted.id,
        workTitle,
        fromHandle: handle,
      });
      notified.add(parentAuthorId);
    }

    if (seederId && seederId !== userId && !notified.has(seederId)) {
      if (parentId) {
        await notifySeedReplyActivity({
          seederId,
          workId,
          commentId: inserted.id,
          workTitle,
          fromHandle: handle,
        });
      } else {
        await notifySeedNewComment({
          seederId,
          workId,
          commentId: inserted.id,
          workTitle,
          fromHandle: handle,
        });
      }
      notified.add(seederId);
    }

    if (!parentId && seederId !== userId) {
      const followerIds = await listFollowerUserIds(userId);
      const short =
        workTitle.length > 36 ? `${workTitle.slice(0, 36)}…` : workTitle;
      await createNotificationsForUsers(followerIds, {
        kind: "comment",
        title: "フォロー中の人がコメントしました",
        body: short
          ? `@${handle} が「${short}」に反応しました。`
          : `@${handle} が作品に反応しました。`,
        href: `/w/${encodeURIComponent(workId)}?c=${encodeURIComponent(inserted.id)}`,
        audience: "mentor",
        actorHandle: handle,
        workId,
      });
    }
  } catch (e) {
    console.error("[POST /api/comments] notify", e);
  }

  return NextResponse.json({ comment, persisted: true });
}
