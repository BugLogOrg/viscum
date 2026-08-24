import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { dmInvites, requestDms, users } from "@/db/schema";
import { coerceDirectRequestAmountYen } from "@/lib/local-request-dms";
import { sanitizeInviteThumbUrl } from "@/lib/request-dm-serialize";

/** 共有用招待＋未割当のやりとりスレを同時作成（ログイン必須） */
export async function POST(req: Request) {
  const session = await auth();
  const fromUserId = session?.user?.id;
  const fromHandle = session?.user?.handle?.replace(/^@/, "").trim();
  if (!fromUserId || !fromHandle) {
    return NextResponse.json(
      { error: "ログインと英語IDが必要です" },
      { status: 401 },
    );
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL 未設定" }, { status: 503 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as {
    workId?: string;
    workTitle?: string;
    workExternalUrl?: string;
    workThumbUrl?: string;
    workSummary?: string;
    amountYen?: number;
    pitch?: string;
    closesInHours?: number;
  } | null;

  const workId = body?.workId?.trim() ?? "";
  const workTitle = (body?.workTitle?.trim() || workId).slice(0, 200);
  if (!workId || !workTitle) {
    return NextResponse.json({ error: "workId / title required" }, { status: 400 });
  }

  const closesAt =
    typeof body?.closesInHours === "number" &&
    Number.isFinite(body.closesInHours) &&
    body.closesInHours > 0
      ? new Date(Date.now() + body.closesInHours * 3600_000)
      : null;

  const amountYen = coerceDirectRequestAmountYen(body?.amountYen, 5000);
  const pitch =
    body?.pitch?.trim().slice(0, 4000) ||
    "共有リンクから直依頼しました。よろしくお願いします。";
  const workExternalUrl = body?.workExternalUrl?.trim().slice(0, 2000) || null;
  const workThumbUrl = sanitizeInviteThumbUrl(body?.workThumbUrl) ?? null;
  const workSummary = body?.workSummary?.trim().slice(0, 12_000) || null;

  const [invite] = await db
    .insert(dmInvites)
    .values({
      fromUserId,
      workId,
      workTitle,
      workExternalUrl,
      workThumbUrl,
      workSummary,
      amountYen,
      pitch,
      closesAt,
    })
    .returning();

  const nowIso = new Date().toISOString();
  const [request] = await db
    .insert(requestDms)
    .values({
      workId,
      workTitle,
      workExternalUrl,
      workThumbUrl,
      workSummary,
      fromUserId,
      toUserId: null,
      inviteId: invite.id,
      amountYen,
      pitch,
      status: "pending",
      closesAt,
      messages: [
        {
          id: crypto.randomUUID(),
          fromHandle,
          body: pitch,
          createdAt: nowIso,
        },
      ],
    })
    .returning();

  return NextResponse.json({
    invite: {
      id: invite.id,
      path: `/dm/i/${invite.id}`,
    },
    request: {
      id: request.id,
      path: `/dashboard/messages/${request.id}`,
    },
    persisted: true,
  });
}

/** 公開読取（URLを知っている人向け） */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
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
      workId: dmInvites.workId,
      workTitle: dmInvites.workTitle,
      workExternalUrl: dmInvites.workExternalUrl,
      workThumbUrl: dmInvites.workThumbUrl,
      workSummary: dmInvites.workSummary,
      amountYen: dmInvites.amountYen,
      pitch: dmInvites.pitch,
      closesAt: dmInvites.closesAt,
      fromUserId: dmInvites.fromUserId,
      createdAt: dmInvites.createdAt,
    })
    .from(dmInvites)
    .where(eq(dmInvites.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const fromRows = await db
    .select({ handle: users.handle, name: users.name })
    .from(users)
    .where(eq(users.id, row.fromUserId))
    .limit(1);
  const from = fromRows[0];

  const requestRows = await db
    .select({ id: requestDms.id })
    .from(requestDms)
    .where(eq(requestDms.inviteId, id))
    .limit(1);

  return NextResponse.json({
    invite: {
      id: row.id,
      workId: row.workId,
      workTitle: row.workTitle,
      workExternalUrl: row.workExternalUrl?.trim() || undefined,
      workThumbUrl: sanitizeInviteThumbUrl(row.workThumbUrl),
      workSummary: row.workSummary?.trim() || undefined,
      amountYen: row.amountYen,
      pitch: row.pitch?.trim() || undefined,
      fromHandle: (from?.handle ?? "").replace(/^@/, "") || "unknown",
      fromAccountName: from?.name?.trim() || undefined,
      createdAt: row.createdAt.toISOString(),
      closesAt: row.closesAt ? row.closesAt.toISOString() : undefined,
      requestId: requestRows[0]?.id,
    },
    persisted: true,
  });
}
