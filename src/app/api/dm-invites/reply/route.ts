import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { dmInvites, requestDms, users } from "@/db/schema";

/**
 * 共有着地からの返事 → 既存の未割当スレに紐づける（なければ新規）。
 * シーダーは /dashboard/messages で返事前からスレを見られる。
 */
export async function POST(req: Request) {
  const session = await auth();
  const mentorUserId = session?.user?.id;
  const mentorHandle = session?.user?.handle?.replace(/^@/, "").trim();
  if (!mentorUserId || !mentorHandle) {
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
    inviteId?: string;
    message?: string;
  } | null;

  const inviteId = body?.inviteId?.trim() ?? "";
  const text = body?.message?.trim().slice(0, 2000) ?? "";
  if (!inviteId || !text) {
    return NextResponse.json(
      { error: "inviteId と message が必要です" },
      { status: 400 },
    );
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
  if (invite.fromUserId === mentorUserId) {
    return NextResponse.json(
      { error: "自分の招待には返事できません" },
      { status: 400 },
    );
  }

  const now = new Date();
  const msg = {
    id: crypto.randomUUID(),
    fromHandle: mentorHandle,
    body: text,
    createdAt: now.toISOString(),
  };

  /** 1) 招待に紐づく先出しスレを優先 */
  const byInvite = await db
    .select()
    .from(requestDms)
    .where(eq(requestDms.inviteId, inviteId))
    .orderBy(desc(requestDms.createdAt))
    .limit(1);

  if (byInvite[0]) {
    const row = byInvite[0];
    if (row.toUserId && row.toUserId !== mentorUserId) {
      return NextResponse.json(
        { error: "この招待は別の相手がすでに返事しています" },
        { status: 409 },
      );
    }
    const last = row.messages?.[row.messages.length - 1];
    const sameRecent =
      last &&
      last.fromHandle.toLowerCase() === mentorHandle.toLowerCase() &&
      last.body.trim() === text &&
      Date.now() - new Date(last.createdAt).getTime() < 8_000;
    const messages = sameRecent
      ? [...(row.messages ?? [])]
      : [...(row.messages ?? []), msg];
    await db
      .update(requestDms)
      .set({
        toUserId: mentorUserId,
        messages,
        updatedAt: now,
      })
      .where(eq(requestDms.id, row.id));
    return NextResponse.json({
      ok: true,
      requestId: row.id,
      path: `/dashboard/messages/${row.id}`,
      persisted: true,
    });
  }

  /** 2) 旧データ: 同じ work の当事者スレ */
  const existing = await db
    .select()
    .from(requestDms)
    .where(
      and(
        eq(requestDms.fromUserId, invite.fromUserId),
        eq(requestDms.toUserId, mentorUserId),
        eq(requestDms.workId, invite.workId),
      ),
    )
    .orderBy(desc(requestDms.createdAt))
    .limit(1);

  let requestId: string;

  if (existing[0]) {
    const row = existing[0];
    const last = row.messages?.[row.messages.length - 1];
    const sameRecent =
      last &&
      last.fromHandle.toLowerCase() === mentorHandle.toLowerCase() &&
      last.body.trim() === text &&
      Date.now() - new Date(last.createdAt).getTime() < 8_000;
    const messages = sameRecent
      ? [...(row.messages ?? [])]
      : [...(row.messages ?? []), msg];
    await db
      .update(requestDms)
      .set({ messages, updatedAt: now, inviteId: inviteId })
      .where(eq(requestDms.id, row.id));
    requestId = row.id;
  } else {
    const seederRows = await db
      .select({ handle: users.handle })
      .from(users)
      .where(eq(users.id, invite.fromUserId))
      .limit(1);
    const seederHandle =
      (seederRows[0]?.handle ?? "").replace(/^@/, "") || "unknown";
    const pitch =
      invite.pitch?.trim() ||
      "共有リンクから直依頼しました。よろしくお願いします。";
    const [inserted] = await db
      .insert(requestDms)
      .values({
        workId: invite.workId,
        workTitle: invite.workTitle,
        workExternalUrl: invite.workExternalUrl,
        workSummary: invite.workSummary,
        fromUserId: invite.fromUserId,
        toUserId: mentorUserId,
        inviteId,
        amountYen: invite.amountYen,
        pitch,
        status: "pending",
        closesAt: invite.closesAt,
        messages: [
          {
            id: crypto.randomUUID(),
            fromHandle: seederHandle,
            body: pitch,
            createdAt: invite.createdAt.toISOString(),
          },
          msg,
        ],
      })
      .returning();
    requestId = inserted.id;
  }

  return NextResponse.json({
    ok: true,
    requestId,
    path: `/dashboard/messages/${requestId}`,
    persisted: true,
  });
}
