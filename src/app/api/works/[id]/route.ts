import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { listFollowerUserIds } from "@/db/follows";
import { createNotificationsForUsers } from "@/db/notifications";
import { users, works } from "@/db/schema";
import {
  getNeonWork,
  isNeonWorkId,
  workFromNeonRow,
} from "@/lib/neon-works";

type Ctx = { params: Promise<{ id: string }> };

/** 1件取得。下書きは作者のみ */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isNeonWorkId(id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  const session = await auth();
  const work = await getNeonWork(id, session?.user?.id ?? null);
  if (!work) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ work, persisted: true });
}

const PatchBody = z.object({
  listedOnShelf: z.boolean().optional(),
});

/** 公開／下書き戻し（作者のみ） */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isNeonWorkId(id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const session = await auth();
  const userId = session?.user?.id?.trim();
  if (!userId) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success || parsed.data.listedOnShelf === undefined) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(works)
    .where(eq(works.id, id))
    .limit(1);
  if (!existing[0] || existing[0].seederId !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const wasListed = existing[0].listedOnShelf;
  const nowListed = parsed.data.listedOnShelf;

  await db
    .update(works)
    .set({
      listedOnShelf: nowListed,
      updatedAt: new Date(),
    })
    .where(eq(works.id, id));

  const row = (
    await db.select().from(works).where(eq(works.id, id)).limit(1)
  )[0];
  const me = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row || !me[0]) {
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }

  // フォロー中の人がシード公開した → フォロワーへ通知（重要）
  if (!wasListed && nowListed && me[0].handle) {
    try {
      const followerIds = await listFollowerUserIds(userId);
      const handle = me[0].handle.replace(/^@/, "").trim();
      const shortTitle =
        row.title.length > 40 ? `${row.title.slice(0, 40)}…` : row.title;
      await createNotificationsForUsers(followerIds, {
        kind: "follow_seed",
        title: "フォロー中の人がシードしました",
        body: `@${handle} が「${shortTitle}」を公開しました。`,
        href: `/w/${encodeURIComponent(id)}`,
        audience: "seeder",
        actorHandle: handle,
        workId: id,
      });
    } catch (e) {
      console.error("[PATCH /api/works] follow_seed notify", e);
    }
  }

  return NextResponse.json({
    work: workFromNeonRow(row, { handle: me[0].handle, name: me[0].name }),
    persisted: true,
  });
}

/** 削除（作者のみ） */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isNeonWorkId(id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const session = await auth();
  const userId = session?.user?.id?.trim();
  if (!userId) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }

  const existing = await db
    .select()
    .from(works)
    .where(eq(works.id, id))
    .limit(1);
  if (!existing[0] || existing[0].seederId !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await db.delete(works).where(eq(works.id, id));
  return NextResponse.json({ ok: true });
}
