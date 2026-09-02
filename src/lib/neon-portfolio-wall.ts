import { desc, eq, sql } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { portfolioWallPosts, users } from "@/db/schema";
import type { PortfolioWallPost } from "@/data/dummy-portfolio-wall";

function hoursAgoFrom(date: Date): number {
  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (60 * 60 * 1000)),
  );
}

export async function userByHandleLower(handle: string) {
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

/** PF壁一覧（サーバ描画・API共用） */
export async function listNeonPortfolioWall(handle: string): Promise<{
  posts: PortfolioWallPost[];
  persisted: boolean;
}> {
  if (!hasDatabase()) {
    return { posts: [], persisted: false };
  }
  const db = getDb();
  if (!db) return { posts: [], persisted: false };

  const owner = await userByHandleLower(handle);
  if (!owner?.handle) {
    return { posts: [], persisted: false };
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

  const portfolioHandle = owner.handle.replace(/^@/, "");
  const posts: PortfolioWallPost[] = rows.map((r) => ({
    id: r.id,
    portfolioHandle,
    author: (r.authorHandle ?? "unknown").replace(/^@/, ""),
    body: r.body,
    hoursAgo: hoursAgoFrom(r.createdAt),
    parentId: r.parentId ?? undefined,
    createdAtIso: r.createdAt.toISOString(),
  }));

  return { posts, persisted: true };
}
