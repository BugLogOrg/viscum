import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { dmInvites } from "@/db/schema";

/**
 * 着地閲覧を1カウント（シーダー自身は除外）。
 * 同一ブラウザの連打はクライアント側 sessionStorage でも抑える。
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    inviteId?: string;
  } | null;
  const inviteId = body?.inviteId?.trim() ?? "";
  if (!inviteId) {
    return NextResponse.json({ error: "inviteId required" }, { status: 400 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DB未設定" }, { status: 503 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  const rows = await db
    .select({
      id: dmInvites.id,
      fromUserId: dmInvites.fromUserId,
      revokedAt: dmInvites.revokedAt,
      viewCount: dmInvites.viewCount,
    })
    .from(dmInvites)
    .where(eq(dmInvites.id, inviteId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (row.revokedAt) {
    return NextResponse.json({ error: "revoked", revoked: true }, { status: 410 });
  }

  const session = await auth();
  if (session?.user?.id && session.user.id === row.fromUserId) {
    return NextResponse.json({
      ok: true,
      skipped: "owner",
      viewCount: row.viewCount ?? 0,
    });
  }

  const [updated] = await db
    .update(dmInvites)
    .set({ viewCount: sql`${dmInvites.viewCount} + 1` })
    .where(and(eq(dmInvites.id, inviteId), isNull(dmInvites.revokedAt)))
    .returning({ viewCount: dmInvites.viewCount });

  return NextResponse.json({
    ok: true,
    viewCount: updated?.viewCount ?? (row.viewCount ?? 0) + 1,
  });
}
