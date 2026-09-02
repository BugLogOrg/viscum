import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { dmInvites, requestDms } from "@/db/schema";
import { notifySeederRequestDeclined } from "@/lib/notify-request-declined";

const GUEST_HANDLE = "（相手）";
const DECLINE_NOTE =
  "いまは無理、と返しました。ご依頼ありがとうございました。いまはお受けできません。";

/**
 * ログイン不要の辞退。
 * 案内リンクを持っている人＝能力。お礼をスレに残し、リンク無効化、依頼主へ通知。
 */
export async function POST(req: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL 未設定" }, { status: 503 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as {
    inviteId?: string;
  } | null;
  const inviteId = body?.inviteId?.trim() ?? "";
  if (!inviteId) {
    return NextResponse.json({ error: "inviteId が必要です" }, { status: 400 });
  }

  const invites = await db
    .select()
    .from(dmInvites)
    .where(eq(dmInvites.id, inviteId))
    .limit(1);
  const invite = invites[0];
  if (!invite) {
    return NextResponse.json({ error: "招待が見つかりません" }, { status: 404 });
  }

  const byInvite = await db
    .select()
    .from(requestDms)
    .where(eq(requestDms.inviteId, inviteId))
    .orderBy(desc(requestDms.createdAt))
    .limit(1);
  let row = byInvite[0];

  if (invite.revokedAt || row?.status === "declined") {
    return NextResponse.json({
      ok: true,
      already: true,
      declined: true,
      path: row ? `/dashboard/messages/${row.id}` : undefined,
    });
  }

  if (row && row.status !== "pending") {
    return NextResponse.json(
      {
        error:
          row.status === "accepted" ||
          row.status === "pay_waiting" ||
          row.status === "paid"
            ? "このお願いはすでに引き受け済みです。辞退はできません。続きはご依頼DMからどうぞ。"
            : "未返信のときだけ辞退できます",
        requestStatus: row.status,
        path: `/dashboard/messages/${row.id}`,
      },
      { status: 400 },
    );
  }

  const now = new Date();
  const note = {
    id: crypto.randomUUID(),
    fromHandle: GUEST_HANDLE,
    body: DECLINE_NOTE,
    createdAt: now.toISOString(),
  };

  if (!row) {
    const pitch =
      invite.pitch?.trim() ||
      "共有リンクから直依頼しました。よろしくお願いします。";
    const [inserted] = await db
      .insert(requestDms)
      .values({
        workId: invite.workId,
        workTitle: invite.workTitle,
        workExternalUrl: invite.workExternalUrl,
        workThumbUrl: invite.workThumbUrl,
        workSummary: invite.workSummary,
        fromUserId: invite.fromUserId,
        toUserId: null,
        inviteId,
        amountYen: invite.amountYen,
        pitch,
        status: "declined",
        closesAt: invite.closesAt,
        messages: [
          {
            id: crypto.randomUUID(),
            fromHandle: GUEST_HANDLE,
            body: pitch,
            createdAt: invite.createdAt.toISOString(),
          },
          note,
        ],
        updatedAt: now,
      })
      .returning();
    row = inserted;
  } else {
    const [updated] = await db
      .update(requestDms)
      .set({
        status: "declined",
        messages: [...(row.messages ?? []), note],
        updatedAt: now,
      })
      .where(eq(requestDms.id, row.id))
      .returning();
    row = updated;
  }

  await db
    .update(dmInvites)
    .set({ revokedAt: now })
    .where(eq(dmInvites.id, inviteId));

  try {
    await notifySeederRequestDeclined({
      seederUserId: invite.fromUserId,
      requestId: row.id,
      workId: invite.workId,
      workTitle: invite.workTitle,
    });
  } catch {
    // 通知失敗でも辞退自体は成立させる（案内は閉じる）
  }

  return NextResponse.json({
    ok: true,
    declined: true,
    requestId: row.id,
    path: `/dashboard/messages/${row.id}`,
  });
}
