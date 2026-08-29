import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { follows, users } from "@/db/schema";

function normalizeHandle(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

async function userIdByHandle(handle: string): Promise<string | null> {
  const key = normalizeHandle(handle);
  if (!key) return null;
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select({ id: users.id, handle: users.handle })
    .from(users)
    .where(sql`lower(${users.handle}) = ${key}`)
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function listFollowingHandles(
  viewerHandle: string,
): Promise<string[]> {
  const viewerId = await userIdByHandle(viewerHandle);
  if (!viewerId) return [];
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ handle: users.handle })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, viewerId));
  return rows
    .map((r) => r.handle)
    .filter((h): h is string => Boolean(h))
    .map((h) => h.toLowerCase());
}

export async function listFollowerHandles(
  targetHandle: string,
): Promise<string[]> {
  const targetId = await userIdByHandle(targetHandle);
  if (!targetId) return [];
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ handle: users.handle })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, targetId));
  return rows
    .map((r) => r.handle)
    .filter((h): h is string => Boolean(h))
    .map((h) => h.toLowerCase());
}

export async function countFollowingByHandle(
  viewerHandle: string,
): Promise<number> {
  const viewerId = await userIdByHandle(viewerHandle);
  if (!viewerId) return 0;
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: count() })
    .from(follows)
    .where(eq(follows.followerId, viewerId));
  return Number(rows[0]?.n ?? 0);
}

export async function countFollowersByHandle(
  targetHandle: string,
): Promise<number> {
  const targetId = await userIdByHandle(targetHandle);
  if (!targetId) return 0;
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: count() })
    .from(follows)
    .where(eq(follows.followingId, targetId));
  return Number(rows[0]?.n ?? 0);
}

export async function isFollowingByHandles(
  viewerHandle: string,
  targetHandle: string,
): Promise<boolean> {
  const viewerId = await userIdByHandle(viewerHandle);
  const targetId = await userIdByHandle(targetHandle);
  if (!viewerId || !targetId) return false;
  const db = getDb();
  if (!db) return false;
  const rows = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, viewerId),
        eq(follows.followingId, targetId),
      ),
    )
    .limit(1);
  return Boolean(rows[0]);
}

export type SetFollowResult =
  | { ok: true; following: boolean; persisted: true }
  | {
      ok: false;
      error: string;
      status: number;
      code?: "missing_target" | "self" | "no_db";
    };

/** 実アカウント同士のフォローを Neon に書く。対象未登録は missing_target。 */
export async function setFollowByHandles(
  viewerUserId: string,
  targetHandle: string,
  next: boolean,
): Promise<SetFollowResult> {
  const db = getDb();
  if (!db) {
    return { ok: false, error: "database unavailable", status: 503, code: "no_db" };
  }

  const target = normalizeHandle(targetHandle);
  if (!target) {
    return { ok: false, error: "handle required", status: 400 };
  }

  const targetRows = await db
    .select({ id: users.id, handle: users.handle })
    .from(users)
    .where(sql`lower(${users.handle}) = ${target}`)
    .limit(1);
  const targetUser = targetRows[0];
  if (!targetUser) {
    return {
      ok: false,
      error: "user not found",
      status: 404,
      code: "missing_target",
    };
  }
  if (targetUser.id === viewerUserId) {
    return { ok: false, error: "cannot follow self", status: 400, code: "self" };
  }

  if (next) {
    await db
      .insert(follows)
      .values({
        followerId: viewerUserId,
        followingId: targetUser.id,
      })
      .onConflictDoNothing();
  } else {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, viewerUserId),
          eq(follows.followingId, targetUser.id),
        ),
      );
  }

  return { ok: true, following: next, persisted: true };
}
