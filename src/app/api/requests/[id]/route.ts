import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { requestDms, users, dmInvites } from "@/db/schema";
import {
  closesAtFromDeadlineDays,
  type RequestDmStatus,
} from "@/lib/local-request-dms";
import { requestDmToClient, sanitizeWorkThumbUrl } from "@/lib/request-dm-serialize";

type Ctx = { params: Promise<{ id: string }> };

async function loadParty(id: string, userId: string) {
  const db = getDb();
  if (!db) return null;
  const thumbExpr = sql<string | null>`case when ${requestDms.workThumbUrl} like 'data:%' then null else ${requestDms.workThumbUrl} end`;
  const rows = await db
    .select({
      id: requestDms.id,
      workId: requestDms.workId,
      workTitle: requestDms.workTitle,
      workExternalUrl: requestDms.workExternalUrl,
      workThumbUrl: thumbExpr,
      workSummary: requestDms.workSummary,
      fromUserId: requestDms.fromUserId,
      toUserId: requestDms.toUserId,
      inviteId: requestDms.inviteId,
      amountYen: requestDms.amountYen,
      pitch: requestDms.pitch,
      status: requestDms.status,
      closesAt: requestDms.closesAt,
      messages: requestDms.messages,
      createdAt: requestDms.createdAt,
      updatedAt: requestDms.updatedAt,
    })
    .from(requestDms)
    .where(eq(requestDms.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.fromUserId !== userId && row.toUserId !== userId) {
    return { forbidden: true as const };
  }
  const full = {
    ...row,
    workThumbUrl: sanitizeWorkThumbUrl(row.workThumbUrl) ?? null,
  } as typeof requestDms.$inferSelect;
  const [from, to] = await Promise.all([
    db
      .select({ handle: users.handle, name: users.name })
      .from(users)
      .where(eq(users.id, row.fromUserId))
      .limit(1),
    row.toUserId
      ? db
          .select({ handle: users.handle, name: users.name })
          .from(users)
          .where(eq(users.id, row.toUserId))
          .limit(1)
      : Promise.resolve([] as { handle: string | null; name: string | null }[]),
  ]);
  return {
    row: full,
    request: requestDmToClient(
      full,
      from[0] ?? { handle: null, name: null },
      row.toUserId ? to[0] ?? { handle: null, name: null } : null,
    ),
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

/** status 更新・希望日延長・メッセージ追記 */
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
    /** 希望日をN日延長（シーダーのみ） */
    extendDays?: number;
  } | null;

  const isSeeder = loaded.row.fromUserId === userId;
  const isMentor = loaded.row.toUserId === userId;
  let messages = [...(loaded.row.messages ?? [])];
  let status = loaded.row.status as RequestDmStatus;
  let closesAt = loaded.row.closesAt ?? null;

  function pushNote(text: string) {
    messages.push({
      id: crypto.randomUUID(),
      fromHandle: handle!,
      body: text,
      createdAt: new Date().toISOString(),
    });
  }

  if (body?.status === "accepted" || body?.status === "declined") {
    if (!isMentor) {
      return NextResponse.json(
        { error: "受取側だけが返信できます" },
        { status: 403 },
      );
    }
    if (status !== "pending") {
      return NextResponse.json(
        { error: "未返信のときだけ引き受け／辞退できます" },
        { status: 400 },
      );
    }
    status = body.status;
    pushNote(
      body.status === "accepted"
        ? "やる、と返しました。"
        : "いまは無理、と返しました。",
    );
    if (body.status === "declined") {
      const inviteId = loaded.row.inviteId?.trim();
      if (inviteId) {
        await db
          .update(dmInvites)
          .set({ revokedAt: new Date() })
          .where(eq(dmInvites.id, inviteId));
      }
      const { notifySeederRequestDeclined } = await import(
        "@/lib/notify-request-declined"
      );
      await notifySeederRequestDeclined({
        seederUserId: loaded.row.fromUserId,
        requestId: loaded.row.id,
        workId: loaded.row.workId,
        workTitle: loaded.row.workTitle,
      });
    }
  } else if (body?.status === "pay_waiting") {
    if (!isMentor) {
      return NextResponse.json(
        { error: "受取側だけが提出できます" },
        { status: 403 },
      );
    }
    if (status !== "accepted" && status !== "pay_waiting") {
      return NextResponse.json(
        { error: "引き受け後に提出できます" },
        { status: 400 },
      );
    }
    if (status !== "pay_waiting") {
      status = "pay_waiting";
      pushNote("提出しました。依頼主の完了承認・お支払い待ちです。");
      try {
        const { notifySeederRequestSubmitted } = await import(
          "@/lib/notify-request-submitted"
        );
        await notifySeederRequestSubmitted({
          seederUserId: loaded.row.fromUserId,
          requestId: loaded.row.id,
          workId: loaded.row.workId,
          workTitle: loaded.row.workTitle,
        });
      } catch {
        // 通知失敗でも提出自体は成立
      }
    }
  } else if (body?.status === "paid") {
    if (!isSeeder) {
      return NextResponse.json(
        { error: "依頼主だけが完了・支払いできます" },
        { status: 403 },
      );
    }
    if (status !== "pay_waiting") {
      return NextResponse.json(
        { error: "支払待ちのときだけ完了できます" },
        { status: 400 },
      );
    }
    const mentorYen = Math.max(0, Math.round(loaded.row.amountYen));
    if (mentorYen > 0) {
      return NextResponse.json(
        {
          error:
            "有料の完了払いは Stripe Checkout から行ってください（/api/checkout/direct-request）",
          useCheckout: true,
        },
        { status: 400 },
      );
    }
    status = "paid";
    pushNote("完了を承認しました（無料・支払済）。");
  } else if (body?.status === "closed") {
    if (!isSeeder) {
      return NextResponse.json(
        { error: "依頼主だけが打ち切れます" },
        { status: 403 },
      );
    }
    if (status === "paid" || status === "declined") {
      return NextResponse.json(
        { error: "この状態では打ち切れません" },
        { status: 400 },
      );
    }
    status = "closed";
    pushNote("依頼主がこのお願いを打ち切りました。");
    const inviteId = loaded.row.inviteId?.trim();
    if (inviteId) {
      await db
        .update(dmInvites)
        .set({ revokedAt: new Date() })
        .where(eq(dmInvites.id, inviteId));
    }
  }

  if (
    typeof body?.extendDays === "number" &&
    Number.isFinite(body.extendDays) &&
    body.extendDays > 0
  ) {
    if (!isSeeder) {
      return NextResponse.json(
        { error: "依頼主だけが希望日を延ばせます" },
        { status: 403 },
      );
    }
    if (status === "paid" || status === "declined" || status === "closed") {
      return NextResponse.json(
        { error: "終了した依頼は延ばせません" },
        { status: 400 },
      );
    }
    const days = Math.min(90, Math.round(body.extendDays));
    const base =
      closesAt && closesAt.getTime() > Date.now() ? closesAt : new Date();
    closesAt = closesAtFromDeadlineDays(days, base);
    pushNote(`希望日を${days}日延ばしました（新しい希望日まで）。`);
  }

  const text = body?.message?.trim().slice(0, 2000);
  if (text) {
    if (status === "paid" || status === "declined" || status === "closed") {
      return NextResponse.json(
        { error: "終了した依頼にはメッセージを送れません" },
        { status: 400 },
      );
    }
    const last = messages[messages.length - 1];
    const sameRecent =
      last &&
      last.fromHandle.toLowerCase() === handle.toLowerCase() &&
      last.body.trim() === text &&
      Date.now() - new Date(last.createdAt).getTime() < 8_000;
    if (!sameRecent) {
      messages.push({
        id: crypto.randomUUID(),
        fromHandle: handle,
        body: text,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const [updated] = await db
    .update(requestDms)
    .set({
      status,
      closesAt,
      messages,
      updatedAt: new Date(),
    })
    .where(eq(requestDms.id, id))
    .returning();

  const request = requestDmToClient(
    { ...updated, workThumbUrl: null },
    {
      handle: loaded.request.fromHandle,
      name: loaded.request.fromAccountName ?? null,
    },
    loaded.request.outboundUnassigned
      ? null
      : {
          handle: loaded.request.toHandle || null,
          name: null,
        },
  );
  request.messages = Array.isArray(updated.messages) ? updated.messages : [];
  request.status = updated.status as RequestDmStatus;
  request.closesAt = updated.closesAt
    ? updated.closesAt.toISOString()
    : undefined;
  request.workSummary = loaded.request.workSummary;
  request.workTitle = loaded.request.workTitle;
  request.fromAccountName = loaded.request.fromAccountName;

  return NextResponse.json({ request, persisted: true });
}
