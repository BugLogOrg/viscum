import { formatYen, planBadgeLabel, type Work } from "@/data/dummy-works";
import { PUBLIC_BOOST } from "@/data/seed-courses";
import { resolvePublicOrigin } from "@/lib/public-origin";

/** 共有文のタイトル上限（OGと同寸。貼り付けが暴れないように） */
const SHARE_TITLE_MAX = 100;

/** SNS貼り付け用の共有文（詳細・公開直後の正本）。ご挨拶・聞くことは載せない */
export function buildWorkShareText(work: Work, origin?: string): string {
  // 共有URLは正規のページURLのみ（?v= は OG画像側だけ）
  // vercel.app で開いていても共有URLは本番（viscum.org）
  const base = resolvePublicOrigin(origin);
  const url = `${base}/w/${work.id}`;
  const lines: string[] = [];
  const planLabel = planBadgeLabel(work.plan);

  if (work.plan === "public_boost") {
    lines.push(
      `【VISCUM】公開ブースト · 褒賞 ${formatYen(work.prizeYen ?? PUBLIC_BOOST.yen)}`,
    );
  } else if (work.prizeYen != null && work.status !== "none") {
    lines.push(
      `【VISCUM】${planLabel ?? "コンペ"} · 褒賞 ${formatYen(work.prizeYen)}`,
    );
  } else {
    lines.push(`【VISCUM】コメント歓迎`);
  }

  let title = (work.title || "（タイトル）").trim().replace(/\s+/g, " ");
  if (title.length > SHARE_TITLE_MAX) {
    title = `${title.slice(0, SHARE_TITLE_MAX - 1)}…`;
  }
  lines.push(title);

  lines.push(url);
  return lines.join("\n");
}

/** 作者本人のX投稿画面を開く（OAuth不要・API不要） */
export function buildXIntentUrl(text: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
