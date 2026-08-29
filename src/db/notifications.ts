import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";

export type NotifyKind =
  | "comment"
  | "adopt_pay"
  | "tip_received"
  | "follow"
  | "follow_seed"
  | "deadline"
  | "direct_request";

export type NotifyAudience = "seeder" | "mentor";

export type CreateNotifyInput = {
  userId: string;
  kind: NotifyKind;
  title: string;
  body: string;
  href: string;
  audience?: NotifyAudience;
  actorHandle?: string | null;
  workId?: string | null;
};

export type AppNotify = {
  id: string;
  kind: NotifyKind;
  title: string;
  body: string;
  href: string;
  audience: NotifyAudience;
  createdAt: string;
  read: boolean;
};

function rowToApp(row: typeof notifications.$inferSelect): AppNotify {
  return {
    id: row.id,
    kind: row.kind as NotifyKind,
    title: row.title,
    body: row.body,
    href: row.href,
    audience: (row.audience === "mentor" ? "mentor" : "seeder") as NotifyAudience,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    read: Boolean(row.readAt),
  };
}

export async function createNotification(
  input: CreateNotifyInput,
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const id = crypto.randomUUID();
  await db.insert(notifications).values({
    id,
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href,
    audience: input.audience ?? "seeder",
    actorHandle: input.actorHandle ?? null,
    workId: input.workId ?? null,
  });
  return id;
}

/** フォロワー一斉（シード公開など）。件数が多いときはチャンク。 */
export async function createNotificationsForUsers(
  userIds: string[],
  input: Omit<CreateNotifyInput, "userId">,
): Promise<number> {
  const db = getDb();
  if (!db || userIds.length === 0) return 0;
  const unique = [...new Set(userIds.filter(Boolean))];
  const chunkSize = 40;
  let written = 0;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    await db.insert(notifications).values(
      chunk.map((userId) => ({
        id: crypto.randomUUID(),
        userId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        href: input.href,
        audience: input.audience ?? "seeder",
        actorHandle: input.actorHandle ?? null,
        workId: input.workId ?? null,
      })),
    );
    written += chunk.length;
  }
  return written;
}

export async function listNotificationsForUser(
  userId: string,
  limit = 80,
): Promise<AppNotify[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map(rowToApp);
}

export async function countUnreadNotifications(
  userId: string,
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
  return Number(rows[0]?.n ?? 0);
}

export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id });
  return updated.length > 0;
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    )
    .returning({ id: notifications.id });
  return updated.length;
}

/** 既読指定の id 群（自分のものだけ） */
export async function markNotificationsReadByIds(
  userId: string,
  ids: string[],
): Promise<number> {
  const db = getDb();
  if (!db || ids.length === 0) return 0;
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        inArray(notifications.id, ids),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id });
  return updated.length;
}
