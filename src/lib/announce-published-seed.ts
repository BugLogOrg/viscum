import type { Work } from "@/data/dummy-works";
import { isPaidShelfPlanForXAnnounce } from "@/lib/x-announce-text";

export type AnnounceResult = {
  skipped?: boolean;
  reason?: string;
  tweetId?: string;
  error?: string;
  text?: string;
};

/** 公開直後に公式Xへ告知（失敗しても公開自体は止めない）。有料棚のみ。 */
export async function announcePublishedSeedToX(
  work: Pick<Work, "id" | "title" | "plan" | "prizeYen" | "status">,
): Promise<AnnounceResult> {
  if (!isPaidShelfPlanForXAnnounce(work.plan)) {
    return { skipped: true, reason: "not_paid_shelf" };
  }
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
    let hint = "";
    if (/401|Unauthorized|authenticat/i.test(r.error)) {
      hint =
        "\n\nよくある原因: Access Token が Read only／別アプリのキー／OAuth2用トークンの取り違え。Vercel の X_API_* を再発行（Read and write）してください。";
    } else if (/402|Payment Required|credits|subscription|paid/i.test(r.error)) {
      hint =
        "\n\n402 は認証OKでも投稿APIに課金が必要な状態です。X Developer の Free 枠では投稿できないことが多く、Basic 以上への加入が必要な場合があります。公開自体は完了しています。SNS文は下からコピーして自分のXに貼れます。";
    }
    return `公開は完了しています。公式X（@viscum_org）への自動告知だけ失敗しました。\n${r.error}${hint}`;
  }
  if (r.skipped) {
    if (r.reason === "not_paid_shelf") {
      return null;
    }
    if (r.reason === "not_configured") {
      return "公開は完了。公式Xの自動告知はいまオフです（告知文は下からコピーできます）。有料コンペ（¥5k／¥10k／¥30k）公開時のみ対象です。";
    }
    return "公開は完了。X告知はスキップされました。";
  }
  if (r.tweetId) {
    return `Xに投稿しました（@viscum_org）。\nhttps://x.com/viscum_org/status/${r.tweetId}`;
  }
  return null;
}
