import type { Work } from "@/data/dummy-works";

export type AnnounceResult = {
  skipped?: boolean;
  reason?: string;
  tweetId?: string;
  error?: string;
  text?: string;
};

/** 公開直後に公式Xへ告知（失敗しても公開自体は止めない） */
export async function announcePublishedSeedToX(
  work: Pick<Work, "id" | "title" | "plan" | "prizeYen" | "status">,
): Promise<AnnounceResult> {
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
    const data = (await res.json().catch(() => ({}))) as AnnounceResult & {
      ok?: boolean;
    };
    if (!res.ok) return { error: data.error || `HTTP ${res.status}` };
    return data;
  } catch {
    return { error: "network" };
  }
}

/** 公開UI用：結果を短く表示（公開成功とX失敗を混ぜない） */
export function announceResultMessage(r: AnnounceResult): string | null {
  if (r.error) {
    const hint = /401|Unauthorized|authenticat/i.test(r.error)
      ? "\n\nよくある原因: Access Token が Read only／別アプリのキー／OAuth2用トークンの取り違え。Vercel の X_API_* 4種を Developer Portal で再発行（Read and write）して入れ直してください。"
      : "";
    return `公開は完了しています。公式X（@viscum_org）への自動告知だけ失敗しました。\n${r.error}${hint}`;
  }
  if (r.skipped) {
    return "公開は完了。X告知はスキップ（環境変数 X_API_* が未設定か無効）です。";
  }
  if (r.tweetId) {
    return `Xに投稿しました（@viscum_org）。\nhttps://x.com/viscum_org/status/${r.tweetId}`;
  }
  return null;
}
