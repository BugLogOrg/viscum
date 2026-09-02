import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { dmInvites, requestDms, users } from "@/db/schema";
import { coerceDirectRequestAmountYen } from "@/lib/local-request-dms";
import { sanitizeInviteThumbUrl } from "@/lib/request-dm-serialize";
import { inviteTeaserSummary } from "@/lib/direct-request-offer";

/** 共有用招待＋未割当のやりとりスレを同時作成（ログイン必須）。replaceInviteId で旧リンク無効化＋再発行 */
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
    /** 指定時: この招待を無効化し、同スナップショットで新リンクを発行 */
    replaceInviteId?: string;
  } | null;

  const replaceInviteId = body?.replaceInviteId?.trim() || "";
  let workId = body?.workId?.trim() ?? "";
  let workTitle = (body?.workTitle?.trim() || workId).slice(0, 200);
  let workExternalUrl = body?.workExternalUrl?.trim().slice(0, 2000) || null;
  let workThumbUrl = sanitizeInviteThumbUrl(body?.workThumbUrl) ?? null;
  let workSummary = body?.workSummary?.trim().slice(0, 12_000) || null;
  let amountYen = coerceDirectRequestAmountYen(body?.amountYen, 5000);
  let pitch =
    body?.pitch?.trim().slice(0, 1000) ||
    "共有リンクから直依頼しました。よろしくお願いします。";
  let closesAt: Date | null =
    typeof body?.closesInHours === "number" &&
    Number.isFinite(body.closesInHours) &&
    body.closesInHours > 0
      ? new Date(Date.now() + body.closesInHours * 3600_000)
      : null;

  if (replaceInviteId) {
    const oldRows = await db
      .select()
      .from(dmInvites)
      .where(
        and(eq(dmInvites.id, replaceInviteId), eq(dmInvites.fromUserId, fromUserId)),
      )
      .limit(1);
    const old = oldRows[0];
    if (!old) {
      return NextResponse.json(
        { error: "無効化する招待が見つかりません" },
        { status: 404 },
      );
    }
    if (old.revokedAt) {
      return NextResponse.json(
        { error: "この招待はすでに無効です。新しいリンクを確定してください" },
        { status: 409 },
      );
    }
    await db
      .update(dmInvites)
      .set({ revokedAt: new Date() })
      .where(eq(dmInvites.id, old.id));

    // 本文未指定なら旧スナップショットを引き継ぐ
    workId = workId || old.workId;
    workTitle = (body?.workTitle?.trim() || old.workTitle || workId).slice(0, 200);
    if (body?.workExternalUrl === undefined) workExternalUrl = old.workExternalUrl;
    if (body?.workThumbUrl === undefined) {
      workThumbUrl = sanitizeInviteThumbUrl(old.workThumbUrl) ?? null;
    }
    if (body?.workSummary === undefined) workSummary = old.workSummary;
    if (body?.amountYen === undefined) amountYen = old.amountYen;
    if (body?.pitch === undefined) {
      pitch = old.pitch?.trim() || pitch;
    }
    if (body?.closesInHours === undefined) closesAt = old.closesAt;
  }

  if (!workId || !workTitle) {
    return NextResponse.json({ error: "workId / title required" }, { status: 400 });
  }

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

  let request: { id: string } | undefined;

  if (replaceInviteId) {
    const linked = await db
      .update(requestDms)
      .set({ inviteId: invite.id, updatedAt: new Date() })
      .where(eq(requestDms.inviteId, replaceInviteId))
      .returning({ id: requestDms.id });
    request = linked[0];
  }

  if (!request) {
    const nowIso = new Date().toISOString();
    const [created] = await db
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
      .returning({ id: requestDms.id });
    request = created;
  }

  return NextResponse.json({
    invite: {
      id: invite.id,
      path: `/dm/i/${invite.id}`,
      viewCount: invite.viewCount ?? 0,
    },
    request: {
      id: request.id,
      path: `/dashboard/messages/${request.id}`,
    },
    replacedInviteId: replaceInviteId || undefined,
    persisted: true,
  });
}

/** 公開読取（URLを知っている人向け）。無効化済みは 410。?lean=1 は閲覧数＋httpsサムネのみ */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim();
  const lean = url.searchParams.get("lean") === "1";
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

  // data: サムネは SELECT 時点で落とす（転送・JSON化を避ける）
  const thumbExpr = sql<string | null>`case when ${dmInvites.workThumbUrl} like 'data:%' then null else ${dmInvites.workThumbUrl} end`;

  if (lean) {
    const leanRows = await db
      .select({
        id: dmInvites.id,
        fromUserId: dmInvites.fromUserId,
        revokedAt: dmInvites.revokedAt,
        viewCount: dmInvites.viewCount,
        workThumbUrl: thumbExpr,
      })
      .from(dmInvites)
      .where(eq(dmInvites.id, id))
      .limit(1);
    const leanRow = leanRows[0];
    if (!leanRow) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (leanRow.revokedAt) {
      return NextResponse.json(
        { error: "revoked", revoked: true },
        { status: 410 },
      );
    }
    const session = await auth();
    const isOwner = session?.user?.id === leanRow.fromUserId;
    return NextResponse.json({
      reveal: "lean" as const,
      invite: {
        id: leanRow.id,
        workThumbUrl: sanitizeInviteThumbUrl(leanRow.workThumbUrl),
        ...(isOwner ? { viewCount: leanRow.viewCount ?? 0 } : {}),
      },
      persisted: true,
    });
  }

  const rows = await db
    .select({
      id: dmInvites.id,
      workId: dmInvites.workId,
      workTitle: dmInvites.workTitle,
      workExternalUrl: dmInvites.workExternalUrl,
      workThumbUrl: thumbExpr,
      workSummary: dmInvites.workSummary,
      amountYen: dmInvites.amountYen,
      pitch: dmInvites.pitch,
      closesAt: dmInvites.closesAt,
      fromUserId: dmInvites.fromUserId,
      createdAt: dmInvites.createdAt,
      revokedAt: dmInvites.revokedAt,
      viewCount: dmInvites.viewCount,
    })
    .from(dmInvites)
    .where(eq(dmInvites.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (row.revokedAt) {
    const declinedRows = await db
      .select({ id: requestDms.id, status: requestDms.status })
      .from(requestDms)
      .where(eq(requestDms.inviteId, id))
      .orderBy(desc(requestDms.createdAt))
      .limit(1);
    const declined = declinedRows[0]?.status === "declined";
    return NextResponse.json(
      {
        error: declined
          ? "このお願いへの返事は済みです（辞退）。ご協力ありがとうございました。"
          : "この招待リンクは無効化されています。依頼主に新しい案内を聞いてください。",
        revoked: true,
        declined,
      },
      { status: 410 },
    );
  }

  const fromRows = await db
    .select({ handle: users.handle, name: users.name })
    .from(users)
    .where(eq(users.id, row.fromUserId))
    .limit(1);
  const from = fromRows[0];

  const requestRows = await db
    .select({
      id: requestDms.id,
      status: requestDms.status,
      toUserId: requestDms.toUserId,
    })
    .from(requestDms)
    .where(eq(requestDms.inviteId, id))
    .orderBy(desc(requestDms.createdAt))
    .limit(1);
  const requestRow = requestRows[0];

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isLoggedIn = Boolean(userId);
  const isOwner = Boolean(userId && userId === row.fromUserId);
  const fromHandle = (from?.handle ?? "").replace(/^@/, "") || "unknown";
  const fromAccountName = from?.name?.trim() || undefined;
  const isRecipient = Boolean(
    userId && requestRow?.toUserId && requestRow.toUserId === userId,
  );
  const status = requestRow?.status ?? "pending";
  const canRespond =
    !isOwner &&
    status === "pending" &&
    (!requestRow?.toUserId || requestRow.toUserId === userId);

  // 未ログイン: サムネ・タイトル・概要級・金額・ご挨拶（作品URL・詳細・希望日は出さない）
  if (!isLoggedIn) {
    const teaser =
      inviteTeaserSummary(row.workSummary) ||
      "ログインすると作品URLとお願いの詳細を確認できます。";
    const pitchPublic = row.pitch?.trim().slice(0, 1000) || undefined;
    const thumbPublic = sanitizeInviteThumbUrl(row.workThumbUrl);
    return NextResponse.json({
      reveal: "teaser" as const,
      invite: {
        id: row.id,
        workTitle: row.workTitle,
        amountYen: row.amountYen,
        fromHandle,
        fromAccountName,
        teaserSummary: teaser,
        ...(thumbPublic ? { workThumbUrl: thumbPublic } : {}),
        ...(pitchPublic ? { pitch: pitchPublic } : {}),
        ...(requestRow
          ? { requestId: requestRow.id, requestStatus: requestRow.status }
          : {}),
      },
      persisted: true,
    });
  }

  return NextResponse.json({
    reveal: "full" as const,
    invite: {
      id: row.id,
      workId: row.workId,
      workTitle: row.workTitle,
      workExternalUrl: row.workExternalUrl?.trim() || undefined,
      workThumbUrl: sanitizeInviteThumbUrl(row.workThumbUrl),
      workSummary: row.workSummary?.trim() || undefined,
      amountYen: row.amountYen,
      pitch: row.pitch?.trim() || undefined,
      fromHandle,
      fromAccountName,
      createdAt: row.createdAt.toISOString(),
      closesAt: row.closesAt ? row.closesAt.toISOString() : undefined,
      requestId: requestRow?.id,
      requestStatus: status,
      /** 受け手がやる／辞退できる（未返信のときだけ） */
      canRespond,
      isOwner,
      isRecipient,
      ...(isOwner ? { viewCount: row.viewCount ?? 0 } : {}),
    },
    persisted: true,
  });
}
