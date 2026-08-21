import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { requestDms, users } from "@/db/schema";
import type { RequestDm, RequestDmStatus } from "@/lib/local-request-dms";

type Ctx = { params: Promise<{ id: string }> };

function toClient(
  row: typeof requestDms.$inferSelect,
  from: { handle: string | null; name: string | null },
  to: { handle: string | null; name: string | null },
): RequestDm {
  return {
    id: row.id,
    workId: row.workId,
    workTitle: row.workTitle,
    workExternalUrl: row.workExternalUrl?.trim() || undefined,
    workThumbUrl: row.workThumbUrl?.trim() || undefined,
    workSummary: row.workSummary?.trim() || undefined,
    fromHandle: (from.handle ?? "").replace(/^@/, "") || "unknown",
    fromAccountName: from.name?.trim() || undefined,
    toHandle: (to.handle ?? "").replace(/^@/, "") || "unknown",
    amountYen: row.amountYen,
    pitch: row.pitch,
    status: row.status as RequestDmStatus,
    createdAt: row.createdAt.toISOString(),
    messages: Array.isArray(row.messages) ? row.messages : [],
  };
}

async function loadParty(id: string, userId: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(requestDms)
    .where(eq(requestDms.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.fromUserId !== userId && row.toUserId !== userId) {
    return { forbidden: true as const };
  }
  const [from, to] = await Promise.all([
    db
      .select({ handle: users.handle, name: users.name })
      .from(users)
      .where(eq(users.id, row.fromUserId))
      .limit(1),
    db
      .select({ handle: users.handle, name: users.name })
      .from(users)
      .where(eq(users.id, row.toUserId))
      .limit(1),
  ]);
  return {
    row,
    request: toClient(row, from[0] ?? { handle: null, name: null }, to[0] ?? {
      handle: null,
      name: null,
    }),
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DB未設定" }, { status: 503 });
  }
  const { id } = await ctx.params;
  const loaded = await loadParty(id, userId);
  if (!loaded) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if ("forbidden" in loaded) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ request: loaded.request, persisted: true });
}

/** status 更新 or メッセージ追記 */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  if (!userId || !handle) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DB未設定" }, { status: 503 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const loaded = await loadParty(id, userId);
  if (!loaded || "forbidden" in loaded) {
    return NextResponse.json(
      { error: loaded && "forbidden" in loaded ? "forbidden" : "not found" },
      { status: loaded && "forbidden" in loaded ? 403 : 404 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    status?: RequestDmStatus;
    message?: string;
  } | null;

  let messages = [...(loaded.row.messages ?? [])];
  let status = loaded.row.status;

  if (body?.status === "accepted" || body?.status === "declined") {
    if (loaded.row.toUserId !== userId) {
      return NextResponse.json(
        { error: "受取側だけが返信できます" },
        { status: 403 },
      );
    }
    status = body.status;
    const note =
      body.status === "accepted" ? "やる、と返しました。" : "いまは無理、と返しました。";
    messages.push({
      id: crypto.randomUUID(),
      fromHandle: handle,
      body: note,
      createdAt: new Date().toISOString(),
    });
  }

  const text = body?.message?.trim().slice(0, 2000);
  if (text) {
    messages.push({
      id: crypto.randomUUID(),
      fromHandle: handle,
      body: text,
      createdAt: new Date().toISOString(),
    });
  }

  const [updated] = await db
    .update(requestDms)
    .set({
      status,
      messages,
      updatedAt: new Date(),
    })
    .where(eq(requestDms.id, id))
    .returning();

  const refreshed = await loadParty(updated.id, userId);
  if (!refreshed || "forbidden" in refreshed) {
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
  return NextResponse.json({ request: refreshed.request, persisted: true });
}
