import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { users } from "@/db/schema";

function normalizeHandle(raw: string) {
  return raw.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24);
}

/** 初回 Magic Link 後の英語ID確定（以降変更は重い） */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "database unavailable" },
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
      { error: "database unavailable" },
      { status: 503 },
    );
  }

  const me = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!me[0]) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
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
    .where(and(eq(users.handle, handle), ne(users.id, userId)))
    .limit(1);
  if (taken[0]) {
    return NextResponse.json(
      { error: "handle taken", message: "この英語IDは使われています" },
      { status: 409 },
    );
  }

  const name =
    me[0].name && me[0].name.trim() !== "" ? me[0].name : handle;

  await db
    .update(users)
    .set({ handle, name })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true, handle, accountName: name });
}
