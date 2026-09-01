import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { dmInvites, requestDms } from "@/db/schema";

/**
 * 招待着地からの引き受け／辞退。
 * 未割当スレなら toUserId を自分に付けてから status を更新。
 * 辞退時は招待も revoke（打ち切りと同型）。
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  if (!userId || !handle) {
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
    status?: "accepted" | "declined";
  } | null;

  const inviteId = body?.inviteId?.trim() ?? "";
  const next = body?.status;
  if (!inviteId || (next !== "accepted" && next !== "declined")) {
    return NextResponse.json(
      { error: "inviteId と status（accepted|declined）が必要です" },
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
  if (invite.revokedAt) {
    return NextResponse.json(
      {
        error:
          "この招待リンクは無効化されています。依頼主に新しい案内を聞いてください。",
        revoked: true,
      },
      { status: 410 },
    );
  }
  if (invite.fromUserId === userId) {
    return NextResponse.json(
      { error: "自分の招待には引き受け／辞退できません" },
      { status: 400 },
    );
  }

  const byInvite = await db
    .select()
    .from(requestDms)
    .where(eq(requestDms.inviteId, inviteId))
    .orderBy(desc(requestDms.createdAt))
    .limit(1);
  let row = byInvite[0];

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
        toUserId: userId,
        inviteId,
        amountYen: invite.amountYen,
        pitch,
        status: "pending",
        closesAt: invite.closesAt,
        messages: [
          {
            id: crypto.randomUUID(),
            fromHandle: handle,
            body: pitch,
            createdAt: invite.createdAt.toISOString(),
          },
        ],
      })
      .returning();
    row = inserted;
  } else {
    if (row.toUserId && row.toUserId !== userId) {
      return NextResponse.json(
        { error: "この招待は別の相手がすでに返事しています" },
        { status: 409 },
      );
    }
    if (row.fromUserId === userId) {
      return NextResponse.json(
        { error: "自分の招待には引き受け／辞退できません" },
        { status: 400 },
      );
    }
    if (row.status !== "pending") {
      // すでに返事済みならスレへ（intent 付きで戻ってきた再入場）
      if (row.toUserId === userId) {
        return NextResponse.json({
          ok: true,
          requestId: row.id,
          status: row.status,
          path: `/dashboard/messages/${row.id}`,
          already: true,
        });
      }
      return NextResponse.json(
        { error: "未返信のときだけ引き受け／辞退できます" },
        { status: 400 },
      );
    }
  }

  const note =
    next === "accepted" ? "やる、と返しました。" : "いまは無理、と返しました。";
  const messages = [
    ...(row.messages ?? []),
    {
      id: crypto.randomUUID(),
      fromHandle: handle,
      body: note,
      createdAt: new Date().toISOString(),
    },
  ];

  const [updated] = await db
    .update(requestDms)
    .set({
      toUserId: userId,
      status: next,
      messages,
      updatedAt: new Date(),
    })
    .where(eq(requestDms.id, row.id))
    .returning();

  if (next === "declined") {
    await db
      .update(dmInvites)
      .set({ revokedAt: new Date() })
      .where(eq(dmInvites.id, inviteId));

    const { notifySeederRequestDeclined } = await import(
      "@/lib/notify-request-declined"
    );
    await notifySeederRequestDeclined({
      seederUserId: invite.fromUserId,
      requestId: updated.id,
      workId: invite.workId,
      workTitle: invite.workTitle,
    });
  }

  return NextResponse.json({
    ok: true,
    requestId: updated.id,
    status: next,
    path: `/dashboard/messages/${updated.id}`,
    persisted: true,
  });
}
