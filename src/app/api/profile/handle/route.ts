import { NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { users } from "@/db/schema";

function normalizeHandle(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

/** 初回 Magic Link 後の英語ID確定（MVPは変更不可。将来 userId 参照なら変更可） */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "unauthorized", message: "ログインし直してください" },
      { status: 401 },
    );
  }
  if (!hasDatabase()) {
    return NextResponse.json(
      {
        error: "database unavailable",
        message: "しばらくしてからもう一度お試しください",
      },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    handle?: string;
  } | null;
  const handle = normalizeHandle(body?.handle ?? "");
  if (handle.length < 2) {
    return NextResponse.json(
      { error: "handle too short", message: "英語IDは2文字以上（英数字と_）" },
      { status: 400 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      {
        error: "database unavailable",
        message: "しばらくしてからもう一度お試しください",
      },
      { status: 503 },
    );
  }

  const me = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!me[0]) {
    return NextResponse.json(
      { error: "user not found", message: "ユーザーが見つかりません" },
      { status: 404 },
    );
  }
  if (me[0].handle) {
    return NextResponse.json(
      {
        error: "handle already set",
        message: "英語IDはすでに設定済みです",
        handle: me[0].handle,
      },
      { status: 409 },
    );
  }

  const taken = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(sql`lower(${users.handle}) = ${handle}`, ne(users.id, userId)),
    )
    .limit(1);
  if (taken[0]) {
    return NextResponse.json(
      {
        error: "handle taken",
        message: "この英語IDはすでに使われています。別のものを選んでください",
      },
      { status: 409 },
    );
  }

  const name =
    me[0].name && me[0].name.trim() !== "" ? me[0].name : handle;

  try {
    await db
      .update(users)
      .set({ handle, name })
      .where(eq(users.id, userId));
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    if (/unique|duplicate/i.test(text)) {
      return NextResponse.json(
        {
          error: "handle taken",
          message:
            "この英語IDはすでに使われています。別のものを選んでください",
        },
        { status: 409 },
      );
    }
    console.error("[profile/handle]", err);
    return NextResponse.json(
      { error: "update failed", message: "設定に失敗しました。もう一度お試しください" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, handle, accountName: name });
}
