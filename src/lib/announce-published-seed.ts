import type { Work } from "@/data/dummy-works";

/** 公開直後に公式Xへ告知（失敗しても公開自体は止めない） */
export async function announcePublishedSeedToX(
  work: Pick<Work, "id" | "title" | "plan" | "prizeYen" | "status">,
): Promise<{ skipped?: boolean; tweetId?: string; error?: string }> {
  try {
    const res = await fetch("/api/x/announce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: work.id,
        title: work.title,
        plan: work.plan,
        prizeYen: work.prizeYen ?? null,
        status: work.status,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      skipped?: boolean;
      tweetId?: string;
      error?: string;
    };
    if (!res.ok) return { error: data.error || `HTTP ${res.status}` };
    return data;
  } catch {
    return { error: "network" };
  }
}
