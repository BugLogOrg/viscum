import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { portfolioWallPosts, users } from "@/db/schema";
import type { PortfolioWallPost } from "@/data/dummy-portfolio-wall";
import {
  notifyProfileWallOwner,
  notifyProfileWallReply,
} from "@/lib/notify-profile-wall";

const NEON_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hoursAgoFrom(date: Date): number {
  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (60 * 60 * 1000)),
  );
}

async function userByHandle(handle: string) {
  const db = getDb();
  if (!db) return null;
  const key = handle.replace(/^@/, "").trim().toLowerCase();
  if (!key) return null;
  const rows = await db
    .select({ id: users.id, handle: users.handle, name: users.name })
    .from(users)
    .where(sql`lower(${users.handle}) = ${key}`)
    .limit(1);
  return rows[0] ?? null;
}

/** GET ?handle= — PF壁コメント一覧 */
export async function GET(req: Request) {
  const handle = new URL(req.url).searchParams.get("handle")?.trim() ?? "";
  if (!handle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ posts: [] as PortfolioWallPost[], persisted: false });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ posts: [] as PortfolioWallPost[], persisted: false });
  }

  const owner = await userByHandle(handle);
  if (!owner?.handle) {
    // 持ち主ユーザーが居ない＝この壁はまだ Neon 正本にできない
    return NextResponse.json({
      posts: [] as PortfolioWallPost[],
      persisted: false,
    });
  }

  const rows = await db
    .select({
      id: portfolioWallPosts.id,
      parentId: portfolioWallPosts.parentId,
      body: portfolioWallPosts.body,
      createdAt: portfolioWallPosts.createdAt,
      authorHandle: users.handle,
    })
    .from(portfolioWallPosts)
    .innerJoin(users, eq(portfolioWallPosts.authorId, users.id))
    .where(eq(portfolioWallPosts.portfolioUserId, owner.id))
    .orderBy(desc(portfolioWallPosts.createdAt))
    .limit(80);

  const posts: PortfolioWallPost[] = rows.map((r) => ({
    id: r.id,
    portfolioHandle: owner.handle!.replace(/^@/, ""),
    author: (r.authorHandle ?? "unknown").replace(/^@/, ""),
    body: r.body,
    hoursAgo: hoursAgoFrom(r.createdAt),
    parentId: r.parentId ?? undefined,
    createdAtIso: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ posts, persisted: true });
}

/** POST — ログイン必須。PF持ち主／返信先著者へ通知 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const myHandle = session?.user?.handle?.replace(/^@/, "").trim();
  if (!userId || !myHandle) {
    return NextResponse.json(
      { error: "ログインと英語IDが必要です" },
      { status: 401 },
    );
  }
  // デモログインも Neon に残す（upsert 済みの demo: ユーザー）。
  // 端末ローカルだけだと他人の画面に出ず「死んでる」ように見える。
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
    handle?: string;
    body?: string;
    parentId?: string;
  } | null;

  const portfolioHandle = body?.handle?.replace(/^@/, "").trim() ?? "";
  const text = body?.body?.trim().slice(0, 4000) ?? "";
  const rawParentId = body?.parentId?.trim() ?? "";

  if (!portfolioHandle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "本文が必要です" }, { status: 400 });
  }

  const owner = await userByHandle(portfolioHandle);
  if (!owner) {
    return NextResponse.json(
      { error: "プロフィールが見つかりません" },
      { status: 404 },
    );
  }

  let parentId: string | null = null;
  let parentAuthorId: string | null = null;
  if (rawParentId) {
    if (!NEON_ID.test(rawParentId)) {
      return NextResponse.json(
        { error: "返信先が不正です" },
        { status: 400 },
      );
    }
    const parents = await db
      .select({
        id: portfolioWallPosts.id,
        portfolioUserId: portfolioWallPosts.portfolioUserId,
        authorId: portfolioWallPosts.authorId,
        parentId: portfolioWallPosts.parentId,
      })
      .from(portfolioWallPosts)
      .where(eq(portfolioWallPosts.id, rawParentId))
      .limit(1);
    const parent = parents[0];
    if (!parent || parent.portfolioUserId !== owner.id) {
      return NextResponse.json(
        { error: "返信先が見つかりません" },
        { status: 404 },
      );
    }
    parentId = parent.id;
    parentAuthorId = parent.authorId;
  }

  const [inserted] = await db
    .insert(portfolioWallPosts)
    .values({
      portfolioUserId: owner.id,
      authorId: userId,
      parentId,
      body: text,
    })
    .returning({
      id: portfolioWallPosts.id,
      parentId: portfolioWallPosts.parentId,
      body: portfolioWallPosts.body,
      createdAt: portfolioWallPosts.createdAt,
    });

  const post: PortfolioWallPost = {
    id: inserted.id,
    portfolioHandle: (owner.handle ?? portfolioHandle).replace(/^@/, ""),
    author: myHandle,
    body: inserted.body,
    hoursAgo: 0,
    parentId: inserted.parentId ?? undefined,
    createdAtIso: inserted.createdAt.toISOString(),
  };

  try {
    const notified = new Set<string>();
    if (parentId && parentAuthorId && parentAuthorId !== userId) {
      await notifyProfileWallReply({
        toUserId: parentAuthorId,
        portfolioHandle: post.portfolioHandle,
        postId: inserted.id,
        fromHandle: myHandle,
        preview: text,
      });
      notified.add(parentAuthorId);
    }
    if (owner.id !== userId && !notified.has(owner.id)) {
      await notifyProfileWallOwner({
        ownerUserId: owner.id,
        portfolioHandle: post.portfolioHandle,
        postId: inserted.id,
        fromHandle: myHandle,
        preview: text,
      });
    }
  } catch (e) {
    console.error("[POST /api/portfolio-wall] notify", e);
  }

  return NextResponse.json({ post, persisted: true });
}
