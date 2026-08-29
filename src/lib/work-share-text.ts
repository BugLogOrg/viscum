import { formatYen, planBadgeLabel, type Work } from "@/data/dummy-works";
import { PUBLIC_BOOST } from "@/data/seed-courses";
import { resolvePublicOrigin } from "@/lib/public-origin";
import { OG_IMAGE_BUST } from "@/lib/work-og";

const MENTOR_ASK_MAX = 100;

/** 共有用にご挨拶だけ短く（聞くことリストは載せない） */
function mentorAskSnippet(work: Work): string | null {
  const greeting = work.focusNote?.trim();
  if (greeting) {
    if (greeting.length <= MENTOR_ASK_MAX) return greeting;
    return `${greeting.slice(0, MENTOR_ASK_MAX)}…`;
  }
  const plan = work.plan;
  // 有料コースの prompts は聞くこと → 共有に出さない
  if (
    plan === "first_impression" ||
    plan === "brush_up" ||
    plan === "public_boost"
  ) {
    return null;
  }
  // 旧無料: prompts にご挨拶相当が入っていた場合
  const raw = (work.prompts ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!raw) return null;
  if (raw.length <= MENTOR_ASK_MAX) return raw;
  return `${raw.slice(0, MENTOR_ASK_MAX)}…`;
}

/** SNS貼り付け用の共有文（詳細・公開直後の正本）。聞くことは載せない */
export function buildWorkShareText(work: Work, origin?: string): string {
  // ?v= で X の「取得失敗キャッシュ」を切る（OG画像 bust と同期）
  // vercel.app で開いていても共有URLは本番（viscum.org）
  const base = resolvePublicOrigin(origin);
  const url = `${base}/w/${work.id}?v=${OG_IMAGE_BUST}`;
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

  lines.push(work.title.trim() || "（タイトル）");

  const ask = mentorAskSnippet(work);
  if (ask) lines.push(ask);

  lines.push(url);
  return lines.join("\n");
}

/** 作者本人のX投稿画面を開く（OAuth不要・API不要） */
export function buildXIntentUrl(text: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
