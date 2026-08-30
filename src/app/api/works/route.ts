import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { users, works } from "@/db/schema";
import {
  listListedNeonWorks,
  workFromNeonRow,
} from "@/lib/neon-works";

const CreateBody = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
  focusNote: z.string().trim().max(4000).optional().nullable(),
  scaffoldLines: z.array(z.string().trim().min(1).max(500)).max(12).optional(),
  externalUrl: z.string().trim().min(8).max(2000),
  /** 公開ブースト必須（サーバでも plan と突き合わせ） */
  boostWriteUrl: z.string().trim().min(8).max(2000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  plan: z.enum([
    "free_comment",
    "first_impression",
    "brush_up",
    "public_boost",
  ]),
  prizeYen: z.number().int().nonnegative().nullable().optional(),
  closesInDays: z.number().int().positive().max(90).nullable().optional(),
  thumbUrl: z
    .string()
    .max(900_000)
    .optional()
    .nullable()
    .refine(
      (v) =>
        v == null ||
        v.startsWith("https://") ||
        v.startsWith("http://") ||
        (v.startsWith("data:image/") && v.length <= 380_000),
      { message: "thumb too large or invalid" },
    ),
  /** 作成直後に棚へ出すか。既定は下書き */
  listedOnShelf: z.boolean().optional().default(false),
});

/** 公開中一覧（フィード）／自分の作品（mine=1） */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const listed = sp.get("listed");
  const mine = sp.get("mine");

  if (mine === "1" || mine === "true") {
    const session = await auth();
    const userId = session?.user?.id?.trim();
    if (!userId) {
      return NextResponse.json({ error: "login required" }, { status: 401 });
    }
    if (!hasDatabase()) {
      return NextResponse.json({ works: [], persisted: false });
    }
    const db = getDb();
    if (!db) {
      return NextResponse.json({ works: [], persisted: false });
    }
    const rows = await db
      .select({
        work: works,
        handle: users.handle,
        name: users.name,
      })
      .from(works)
      .innerJoin(users, eq(works.seederId, users.id))
      .where(eq(works.seederId, userId))
      .orderBy(desc(works.updatedAt))
      .limit(80);
    return NextResponse.json({
      works: rows.map((r) =>
        workFromNeonRow(r.work, { handle: r.handle, name: r.name }),
      ),
      persisted: true,
    });
  }

  if (listed !== "1" && listed !== "true") {
    return NextResponse.json(
      { error: "listed=1 or mine=1 required" },
      { status: 400 },
    );
  }
  if (!hasDatabase()) {
    return NextResponse.json({ works: [], persisted: false });
  }
  const worksList = await listListedNeonWorks();
  return NextResponse.json({ works: worksList, persisted: true });
}

/** 棚シード作成（ログイン必須） */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id?.trim();
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  if (!userId || !handle) {
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
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const me = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!me[0]) {
    return NextResponse.json({ error: "user missing" }, { status: 400 });
  }

  const isComp =
    body.plan === "first_impression" || body.plan === "brush_up";
  const isBoost = body.plan === "public_boost";
  const boostWriteUrl =
    isBoost && body.boostWriteUrl && body.boostWriteUrl.trim().length > 8
      ? body.boostWriteUrl.trim()
      : null;
  if (isBoost && !boostWriteUrl) {
    return NextResponse.json(
      { error: "boostWriteUrl required for public_boost" },
      { status: 400 },
    );
  }
  const status = isComp || isBoost ? "open" : "none";
  const prizeYen =
    isComp || isBoost
      ? (body.prizeYen ??
          (body.plan === "first_impression"
            ? 5000
            : body.plan === "brush_up"
              ? 10000
              : 30000))
      : null;
  const closesAt =
    isComp && body.closesInDays
      ? new Date(Date.now() + body.closesInDays * 86_400_000)
      : isBoost
        ? new Date(Date.now() + 7 * 86_400_000)
        : null;

  const id = crypto.randomUUID();
  const now = new Date();
  const thumb =
    body.thumbUrl && body.thumbUrl.length <= 900_000 ? body.thumbUrl : null;

  await db.insert(works).values({
    id,
    seederId: userId,
    title: body.title,
    description: body.description,
    focusNote: body.focusNote?.trim() || null,
    scaffoldLines: body.scaffoldLines?.length ? body.scaffoldLines : null,
    externalUrl: body.externalUrl,
    boostWriteUrl,
    tags: body.tags,
    plan: body.plan,
    status,
    prizeYen,
    closesAt,
    thumbUrl: thumb,
    listedOnShelf: body.listedOnShelf ?? false,
    createdAt: now,
    updatedAt: now,
  });

  const row = (
    await db.select().from(works).where(eq(works.id, id)).limit(1)
  )[0];
  if (!row) {
    return NextResponse.json({ error: "insert failed" }, { status: 500 });
  }

  const work = workFromNeonRow(row, {
    handle: me[0].handle,
    name: me[0].name,
  });

  if (row.listedOnShelf && me[0].handle) {
    try {
      const { listFollowerUserIds } = await import("@/db/follows");
      const { createNotificationsForUsers } = await import("@/db/notifications");
      const followerIds = await listFollowerUserIds(userId);
      const h = me[0].handle.replace(/^@/, "").trim();
      const shortTitle =
        row.title.length > 40 ? `${row.title.slice(0, 40)}…` : row.title;
      await createNotificationsForUsers(followerIds, {
        kind: "follow_seed",
        title: "フォロー中の人がシードしました",
        body: `@${h} が「${shortTitle}」を公開しました。`,
        href: `/w/${encodeURIComponent(id)}`,
        audience: "seeder",
        actorHandle: h,
        workId: id,
      });
    } catch (e) {
      console.error("[POST /api/works] follow_seed notify", e);
    }
  }

  return NextResponse.json({ work, persisted: true }, { status: 201 });
}
