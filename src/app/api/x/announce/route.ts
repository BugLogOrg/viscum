import { NextResponse } from "next/server";
import { z } from "zod";
import { TwitterApi, ApiResponseError } from "twitter-api-v2";
import { auth } from "@/auth";
import {
  buildXAnnounceText,
  isPaidShelfPlanForXAnnounce,
} from "@/lib/x-announce-text";
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

function probeErrorMessage(e: unknown): string {
  if (e instanceof ApiResponseError) {
    return `X API ${e.code}: ${e.message}`;
  }
  if (e instanceof Error) return e.message;
  return "probe failed";
}

/** 設定の有無＋任意で認証プローブ（秘密は出さない） */
export async function GET(req: Request) {
  const session = await auth();
  const probe = new URL(req.url).searchParams.get("probe") === "1";
  const base = {
    loggedIn: Boolean(session?.user),
    handle: session?.user?.handle ?? null,
    configured: isXAnnounceConfigured(),
    announceEnabled: process.env.X_ANNOUNCE_ENABLED === "1",
    paidShelfOnly: true,
    hasApiKey: Boolean(process.env.X_API_KEY?.trim()),
    hasApiSecret: Boolean(process.env.X_API_SECRET?.trim()),
    hasAccessToken: Boolean(process.env.X_ACCESS_TOKEN?.trim()),
    hasAccessSecret: Boolean(process.env.X_ACCESS_SECRET?.trim()),
  };

  if (!probe) {
    return NextResponse.json(base);
  }

  if (!isXAnnounceConfigured()) {
    return NextResponse.json({
      ...base,
      probeOk: false,
      probeError: "not_configured",
    });
  }

  try {
    const client = new TwitterApi({
      appKey: process.env.X_API_KEY!.trim(),
      appSecret: process.env.X_API_SECRET!.trim(),
      accessToken: process.env.X_ACCESS_TOKEN!.trim(),
      accessSecret: process.env.X_ACCESS_SECRET!.trim(),
    });
    const me = await client.v2.me();
    return NextResponse.json({
      ...base,
      probeOk: true,
      username: me.data.username ?? null,
      userId: me.data.id ?? null,
    });
  } catch (e) {
    return NextResponse.json({
      ...base,
      probeOk: false,
      probeError: probeErrorMessage(e),
    });
  }
}

/**
 * 有料棚コンペ公開時に公式 @viscum_org へ告知（ADR-037）。
 * 無料・直依頼は skipped。X_* 未設定／X_ANNOUNCE_ENABLED≠1 も skipped。
 */
export async function POST(req: Request) {
  const session = await auth();
  // handle 未設定（オンボーディング途中）でもログイン済みなら告知可
  if (!session?.user?.id) {
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

  if (!isPaidShelfPlanForXAnnounce(parsed.data.plan)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "not_paid_shelf",
    });
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
