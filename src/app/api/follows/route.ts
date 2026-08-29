import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasDatabase } from "@/db";
import {
  countFollowersByHandle,
  countFollowingByHandle,
  isFollowingByHandles,
  listFollowerHandles,
  listFollowingHandles,
  setFollowByHandles,
} from "@/db/follows";

function normalizeHandle(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

/**
 * GET
 * - ?handle=xxx … 公開グラフ（フォロー／フォロワー一覧＋件数）
 * - ?mine=1 … ログイン中ユーザーがフォローしている英語ID（フィード用）
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "1";
  const handleRaw = url.searchParams.get("handle")?.trim() ?? "";
  const handle = normalizeHandle(handleRaw);

  if (!hasDatabase()) {
    if (mine) {
      return NextResponse.json({ following: [], persisted: false });
    }
    return NextResponse.json({
      handle,
      following: [],
      followers: [],
      followingCount: 0,
      followerCount: 0,
      meFollowing: false,
      persisted: false,
    });
  }

  if (mine) {
    const session = await auth();
    const me = session?.user?.handle?.trim();
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const following = await listFollowingHandles(me);
    return NextResponse.json({ following, persisted: true });
  }

  if (!handle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }

  const [following, followers, followingCount, followerCount] =
    await Promise.all([
      listFollowingHandles(handle),
      listFollowerHandles(handle),
      countFollowingByHandle(handle),
      countFollowersByHandle(handle),
    ]);

  let meFollowing = false;
  const session = await auth();
  const me = session?.user?.handle?.trim();
  if (me) {
    meFollowing = await isFollowingByHandles(me, handle);
  }

  return NextResponse.json({
    handle,
    following,
    followers,
    followingCount,
    followerCount,
    meFollowing,
    persisted: true,
  });
}

/** POST { handle, following: boolean } — 実アカウント同士を Neon に保存 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const meHandle = session?.user?.handle?.trim();
  if (!userId || !meHandle) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (userId.startsWith("demo:")) {
    return NextResponse.json(
      { error: "demo session", code: "demo_session", persisted: false },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    handle?: string;
    following?: boolean;
  } | null;
  if (!body || typeof body.following !== "boolean") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const target = normalizeHandle(body.handle ?? "");
  if (!target) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "database unavailable", code: "no_db", persisted: false },
      { status: 503 },
    );
  }

  const result = await setFollowByHandles(userId, target, body.following);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, persisted: false },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    handle: target,
    following: result.following,
    persisted: true,
  });
}
