import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { requestDms, users } from "@/db/schema";
import { listMyRequestDms } from "@/lib/list-my-request-dms";
import {
  requestDmToClient,
  sanitizeWorkThumbUrl,
} from "@/lib/request-dm-serialize";
import { coerceDirectRequestAmountYen } from "@/lib/local-request-dms";

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

/** 自分関連の直依頼一覧（サムネは返さない＝高速化） */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { requests, persisted } = await listMyRequestDms(userId);
  return NextResponse.json({ requests, persisted });
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
    closesInHours?: number;
  } | null;

  const workId = body?.workId?.trim() ?? "";
  const workTitle = (body?.workTitle?.trim() || workId).slice(0, 120);
  const workExternalUrl = body?.workExternalUrl?.trim().slice(0, 2000) || null;
  // data URL は保存しない（読み込みが極端に遅くなる）
  const workThumbUrl = sanitizeWorkThumbUrl(body?.workThumbUrl) ?? null;
  const workSummary = body?.workSummary?.trim().slice(0, 12_000) || null;
  const toHandle = body?.toHandle?.replace(/^@/, "").trim().toLowerCase() ?? "";
  const pitch = body?.pitch?.trim().slice(0, 4000) || "よろしくお願いします。";
  const amountYen = coerceDirectRequestAmountYen(body?.amountYen, 5000);
  const closesAt =
    typeof body?.closesInHours === "number" &&
    Number.isFinite(body.closesInHours) &&
    body.closesInHours > 0
      ? new Date(Date.now() + body.closesInHours * 3600_000)
      : null;

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
      closesAt,
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
  const request = requestDmToClient(
    inserted,
    { handle: fromHandle, name: fromName },
    { handle: toUser.handle, name: toUser.name },
  );

  return NextResponse.json({ request, persisted: true });
}
