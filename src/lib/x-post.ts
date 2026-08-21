import { TwitterApi } from "twitter-api-v2";

export function isXAnnounceConfigured(): boolean {
  if (process.env.X_ANNOUNCE_ENABLED === "0") return false;
  return Boolean(
    process.env.X_API_KEY?.trim() &&
      process.env.X_API_SECRET?.trim() &&
      process.env.X_ACCESS_TOKEN?.trim() &&
      process.env.X_ACCESS_SECRET?.trim(),
  );
}

/** @viscum_org として投稿。未設定時は null */
export async function postTweetAsViscum(
  text: string,
): Promise<{ ok: true; tweetId: string } | { ok: false; error: string }> {
  if (!isXAnnounceConfigured()) {
    return { ok: false, error: "X announce not configured" };
  }
  try {
    const client = new TwitterApi({
      appKey: process.env.X_API_KEY!.trim(),
      appSecret: process.env.X_API_SECRET!.trim(),
      accessToken: process.env.X_ACCESS_TOKEN!.trim(),
      accessSecret: process.env.X_ACCESS_SECRET!.trim(),
    });
    const res = await client.v2.tweet(text.slice(0, 280));
    const tweetId = res.data?.id;
    if (!tweetId) return { ok: false, error: "no tweet id" };
    return { ok: true, tweetId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "tweet failed";
    return { ok: false, error: msg };
  }
}
