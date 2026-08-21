import { formatYen, planBadgeLabel, type Work } from "@/data/dummy-works";
import { PUBLIC_BOOST } from "@/data/seed-courses";

const MENTOR_ASK_MAX = 100;

/** 共有用にメンターへのお願いだけ短く（足場の聞くことは載せない） */
function mentorAskSnippet(work: Work): string | null {
  const plan = work.plan;
  // コンペ／公開ブーストの prompts は足場＝聞きたいこと → 共有に出さない
  if (
    plan === "first_impression" ||
    plan === "brush_up" ||
    plan === "public_boost"
  ) {
    return null;
  }
  const raw = (work.prompts ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!raw) return null;
  if (raw.length <= MENTOR_ASK_MAX) return raw;
  return `${raw.slice(0, MENTOR_ASK_MAX)}…`;
}

/** SNS貼り付け用の共有文（詳細・公開直後の正本）。聞きたいこと（足場）は載せない */
export function buildWorkShareText(work: Work, origin: string): string {
  const url = `${origin.replace(/\/$/, "")}/w/${work.id}`;
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
