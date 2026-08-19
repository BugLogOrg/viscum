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

type UserRow = typeof users.$inferSelect;

/**
 * セッションはあるが users 行が無い／id ずれ、を救済。
 * （JWT＋adapter でオンボに来たのに行が無いと「ユーザーが見つかりません」になる）
 */
async function resolveSessionUser(
  db: NonNullable<ReturnType<typeof getDb>>,
  session: {
    user?: { id?: string | null; email?: string | null; name?: string | null };
  },
): Promise<UserRow | null> {
  const userId = session.user?.id?.trim() || "";
  const email = session.user?.email?.trim() || "";

  if (userId) {
    const byId = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (byId[0]) return byId[0];
  }

  if (email) {
    const byEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (byEmail[0]) return byEmail[0];
  }

  if (!userId && !email) return null;

  const id = userId || crypto.randomUUID();
  try {
    await db.insert(users).values({
      id,
      email: email || null,
      name: session.user?.name?.trim() || null,
      handle: null,
    });
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    // 並行作成・email unique など → 再読込
    if (email) {
      const again = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (again[0]) return again[0];
    }
    if (userId) {
      const again = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (again[0]) return again[0];
    }
    console.error("[profile/handle] ensure user", err, text);
    return null;
  }

  const created = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return created[0] ?? null;
}

/** 初回 Magic Link 後の英語ID確定（MVPは変更不可。将来 userId 参照なら変更可） */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
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

  const me = await resolveSessionUser(db, session);
  if (!me) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "ログインの状態が切れています。もう一度ログインしてください",
      },
      { status: 401 },
    );
  }

  if (me.handle) {
    return NextResponse.json(
      {
        error: "handle already set",
        message: "英語IDはすでに設定済みです",
        handle: me.handle,
      },
      { status: 409 },
    );
  }

  const taken = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(sql`lower(${users.handle}) = ${handle}`, ne(users.id, me.id)),
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
    me.name && me.name.trim() !== "" ? me.name : handle;

  try {
    await db
      .update(users)
      .set({ handle, name })
      .where(eq(users.id, me.id));
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
      {
        error: "update failed",
        message: "設定に失敗しました。もう一度お試しください",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, handle, accountName: name });
}
