import { desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { users, works, type WorkRow } from "@/db/schema";
import type { CompStatus, DemoSeedPlan, Work } from "@/data/dummy-works";
import { auth } from "@/auth";

/** Neon 作品ID（UUID）。local_ / デモ短いID と区別 */
export function isNeonWorkId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id.trim(),
  );
}

function hoursAgoFrom(date: Date): number {
  return Math.max(0, (Date.now() - date.getTime()) / 3_600_000);
}

function closesInHoursFrom(closesAt: Date | null): number | undefined {
  if (!closesAt) return undefined;
  const h = (closesAt.getTime() - Date.now()) / 3_600_000;
  return Math.max(0, h);
}

function asPlan(plan: string | null): DemoSeedPlan | undefined {
  if (
    plan === "free_comment" ||
    plan === "first_impression" ||
    plan === "brush_up" ||
    plan === "public_boost"
  ) {
    return plan;
  }
  return undefined;
}

function asStatus(status: string): CompStatus {
  if (
    status === "none" ||
    status === "open" ||
    status === "pay_soon" ||
    status === "closed"
  ) {
    return status;
  }
  return "none";
}

export function workFromNeonRow(
  row: WorkRow,
  seeder: { handle: string | null; name: string | null },
): Work {
  const handle = (seeder.handle ?? "").replace(/^@/, "").trim() || "unknown";
  const name = seeder.name?.trim();
  return {
    id: row.id,
    title: row.title,
    tagline: row.title.slice(0, 100),
    seeder: handle,
    seederAccountName:
      name && name.toLowerCase() !== handle.toLowerCase() ? name : undefined,
    tags: row.tags ?? [],
    status: asStatus(row.status),
    plan: asPlan(row.plan),
    prizeYen: row.prizeYen ?? undefined,
    hoursAgo: hoursAgoFrom(row.createdAt),
    closesInHours: closesInHoursFrom(row.closesAt),
    description: row.description,
    focusNote: row.focusNote?.trim() || undefined,
    prompts: row.scaffoldLines?.length
      ? row.scaffoldLines.map((s) => s.trim()).filter(Boolean)
      : undefined,
    externalUrl: row.externalUrl,
    thumbTone: "leaf",
    thumbUrl: row.thumbUrl ?? undefined,
    comments: [],
    sukiCount: row.emoCount,
    bookmarkCount: row.bookmarkCount,
    persisted: true,
    listedOnShelf: row.listedOnShelf,
  };
}

/** 公開中の棚作品（フィード用） */
export async function listListedNeonWorks(limit = 80): Promise<Work[]> {
  if (!hasDatabase()) return [];
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select({
      work: works,
      handle: users.handle,
      name: users.name,
    })
    .from(works)
    .innerJoin(users, eq(works.seederId, users.id))
    .where(eq(works.listedOnShelf, true))
    .orderBy(desc(works.createdAt))
    .limit(limit);

  return rows.map((r) =>
    workFromNeonRow(r.work, { handle: r.handle, name: r.name }),
  );
}

/**
 * 1件取得。下書きは作者本人だけ。
 * viewerUserId が無いとき下書きは null。
 */
export async function getNeonWork(
  id: string,
  viewerUserId?: string | null,
): Promise<Work | null> {
  if (!hasDatabase() || !isNeonWorkId(id)) return null;
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      work: works,
      handle: users.handle,
      name: users.name,
    })
    .from(works)
    .innerJoin(users, eq(works.seederId, users.id))
    .where(eq(works.id, id))
    .limit(1);

  const hit = rows[0];
  if (!hit) return null;
  if (!hit.work.listedOnShelf) {
    if (!viewerUserId || viewerUserId !== hit.work.seederId) return null;
  }
  return workFromNeonRow(hit.work, {
    handle: hit.handle,
    name: hit.name,
  });
}

/** サーバ page 用：セッションを見て下書きも作者に返す */
export async function getNeonWorkForRequest(id: string): Promise<Work | null> {
  const session = await auth();
  return getNeonWork(id, session?.user?.id ?? null);
}

export async function getNeonWorkRow(id: string): Promise<WorkRow | null> {
  if (!hasDatabase() || !isNeonWorkId(id)) return null;
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(works).where(eq(works.id, id)).limit(1);
  return rows[0] ?? null;
}
