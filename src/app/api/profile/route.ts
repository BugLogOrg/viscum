import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { users } from "@/db/schema";
import { normalizeAccountName } from "@/lib/local-profile";

/** 公開読み取り（端末間同期の正本が DB のとき） */
export async function GET(req: Request) {
  const handle = new URL(req.url).searchParams.get("handle")?.trim();
  if (!handle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }

  if (!hasDatabase()) {
    return NextResponse.json({
      handle,
      accountName: null,
      bio: null,
      image: null,
      persisted: false,
    });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({
      handle,
      accountName: null,
      bio: null,
      image: null,
      persisted: false,
    });
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);
  const u = rows[0];
  if (!u) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    handle: u.handle,
    accountName: u.name,
    bio: u.bio,
    image: u.image,
    persisted: true,
  });
}

/** ログイン中ユーザーのプロフィール更新 */
export async function PATCH(req: Request) {
  const session = await auth();
  const handle = session?.user?.handle;
  const userId = session?.user?.id;
  if (!handle || !userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    accountName?: string;
    bio?: string;
    image?: string | null;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const accountName = normalizeAccountName(body.accountName ?? "");
  if (!accountName) {
    return NextResponse.json(
      { error: "アカウント名が必要です" },
      { status: 400 },
    );
  }
  const bio = (body.bio ?? "").trim().slice(0, 500);
  const image =
    body.image === null
      ? null
      : typeof body.image === "string"
        ? body.image.slice(0, 250_000)
        : undefined;

  if (!hasDatabase()) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      hint: "DATABASE_URL 未設定のため端末内のみ。Neon接続後に横断同期できます。",
    });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const patch = {
    name: accountName,
    bio,
    ...(image !== undefined ? { image } : {}),
    handle,
  };

  if (existing[0]) {
    await db.update(users).set(patch).where(eq(users.id, userId));
  } else {
    await db.insert(users).values({
      id: userId,
      handle,
      name: accountName,
      bio,
      image: image ?? null,
      email: session.user.email,
    });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
