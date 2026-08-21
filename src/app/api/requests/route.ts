import { NextResponse } from "next/server";
import { desc, eq, inArray, or, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { requestDms, users } from "@/db/schema";
import type { RequestDm } from "@/lib/local-request-dms";

async function userByHandle(handle: string) {
  const db = getDb();
  if (!db) return null;
  const key = handle.replace(/^@/, "").trim().toLowerCase();
  if (!key) return null;
  const rows = await db
    .select({
      id: users.id,
      handle: users.handle,
      name: users.name,
    })
    .from(users)
    .where(sql`lower(${users.handle}) = ${key}`)
    .limit(1);
  return rows[0] ?? null;
}

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
    status: row.status as RequestDm["status"],
    createdAt: row.createdAt.toISOString(),
    messages: Array.isArray(row.messages) ? row.messages : [],
  };
}

/** 自分関連の直依頼一覧 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ requests: [] as RequestDm[], persisted: false });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ requests: [] as RequestDm[], persisted: false });
  }

  const rows = await db
    .select()
    .from(requestDms)
    .where(
      or(eq(requestDms.fromUserId, userId), eq(requestDms.toUserId, userId)),
    )
    .orderBy(desc(requestDms.createdAt))
    .limit(60);

  const userIds = [
    ...new Set(rows.flatMap((r) => [r.fromUserId, r.toUserId])),
  ];
  const userRows =
    userIds.length === 0
      ? []
      : await db
          .select({
            id: users.id,
            handle: users.handle,
            name: users.name,
          })
          .from(users)
          .where(inArray(users.id, userIds));
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  const out = rows.map((r) => {
    const from = userMap.get(r.fromUserId);
    const to = userMap.get(r.toUserId);
    return toClient(
      r,
      { handle: from?.handle ?? null, name: from?.name ?? null },
      { handle: to?.handle ?? null, name: to?.name ?? null },
    );
  });

  return NextResponse.json({ requests: out, persisted: true });
}

/** 直依頼を送る */
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
    toHandle?: string;
    amountYen?: number;
    pitch?: string;
  } | null;

  const workId = body?.workId?.trim() ?? "";
  const workTitle = (body?.workTitle?.trim() || workId).slice(0, 120);
  const workExternalUrl = body?.workExternalUrl?.trim().slice(0, 2000) || null;
  const rawThumb = body?.workThumbUrl?.trim() || "";
  // data URL は肥大化しやすいので上限（受け手表示用のスナップショット）
  const workThumbUrl =
    rawThumb && rawThumb.length <= 700_000 ? rawThumb : null;
  // 受け手が /w を開けない場合の全文確認用（説明＋聞くこと）
  const workSummary = body?.workSummary?.trim().slice(0, 12_000) || null;
  const toHandle = body?.toHandle?.replace(/^@/, "").trim().toLowerCase() ?? "";
  const pitch = body?.pitch?.trim().slice(0, 4000) || "よろしくお願いします。";
  const amountYen =
    typeof body?.amountYen === "number" && body.amountYen >= 5000
      ? Math.round(body.amountYen)
      : 5000;

  if (!workId) {
    return NextResponse.json({ error: "workId required" }, { status: 400 });
  }
  if (!toHandle) {
    return NextResponse.json({ error: "相手の英語IDが必要です" }, { status: 400 });
  }
  if (toHandle === fromHandle.toLowerCase()) {
    return NextResponse.json(
      { error: "自分には頼めません" },
      { status: 400 },
    );
  }

  const toUser = await userByHandle(toHandle);
  if (!toUser) {
    return NextResponse.json(
      {
        error:
          "相手がまだVISCUMに登録されていません。英語IDのアカウントが必要です（外部向けURLを使ってください）",
      },
      { status: 404 },
    );
  }

  const createdAt = new Date();
  const [inserted] = await db
    .insert(requestDms)
    .values({
      workId,
      workTitle,
      workExternalUrl,
      workThumbUrl,
      workSummary,
      fromUserId,
      toUserId: toUser.id,
      amountYen,
      pitch,
      status: "pending",
      messages: [
        {
          id: crypto.randomUUID(),
          fromHandle,
          body: pitch,
          createdAt: createdAt.toISOString(),
        },
      ],
    })
    .returning();

  const fromName = session.user?.name?.trim() || null;
  const request = toClient(
    inserted,
    { handle: fromHandle, name: fromName },
    { handle: toUser.handle, name: toUser.name },
  );

  return NextResponse.json({ request, persisted: true });
}
