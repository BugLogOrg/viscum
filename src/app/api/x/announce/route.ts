import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { buildXAnnounceText } from "@/lib/x-announce-text";
import { isXAnnounceConfigured, postTweetAsViscum } from "@/lib/x-post";

const Body = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(500),
  plan: z
    .enum(["free_comment", "first_impression", "brush_up", "public_boost"])
    .optional(),
  prizeYen: z.number().int().nonnegative().nullable().optional(),
  status: z.enum(["none", "open", "pay_soon", "closed"]).optional(),
});

/** 設定の有無だけ返す（秘密は出さない・診断用にログイン不要） */
export async function GET() {
  const session = await auth();
  return NextResponse.json({
    loggedIn: Boolean(session?.user),
    handle: session?.user?.handle ?? null,
    configured: isXAnnounceConfigured(),
    announceEnabled: process.env.X_ANNOUNCE_ENABLED !== "0",
    hasApiKey: Boolean(process.env.X_API_KEY?.trim()),
    hasApiSecret: Boolean(process.env.X_API_SECRET?.trim()),
    hasAccessToken: Boolean(process.env.X_ACCESS_TOKEN?.trim()),
    hasAccessSecret: Boolean(process.env.X_ACCESS_SECRET?.trim()),
  });
}

/**
 * シード公開時に公式 @viscum_org へ告知。
 * X_* 環境変数が無い／X_ANNOUNCE_ENABLED=0 のときは skipped。
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.handle) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isXAnnounceConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "not_configured",
    });
  }

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "https://viscum.vercel.app";

  const text = buildXAnnounceText(parsed.data, origin);
  const posted = await postTweetAsViscum(text);
  if (!posted.ok) {
    console.error("[x/announce]", posted.error);
    return NextResponse.json(
      { ok: false, error: posted.error },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    tweetId: posted.tweetId,
    text,
  });
}
