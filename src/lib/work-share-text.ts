import { formatYen, planBadgeLabel, type Work } from "@/data/dummy-works";
import { PUBLIC_BOOST } from "@/data/seed-courses";

/** SNS貼り付け用の共有文（詳細ページ・シード直後バナーの正本） */
export function buildWorkShareText(work: Work, origin: string): string {
  const url = `${origin.replace(/\/$/, "")}/w/${work.id}`;
  const lines: string[] = [];
  const planLabel = planBadgeLabel(work.plan);

  if (work.plan === "public_boost") {
    lines.push(
      `【VISCUM】公開ブースト · 褒賞 ${formatYen(work.prizeYen ?? PUBLIC_BOOST.yen)}（記入後報告→選んで褒賞）`,
    );
  } else if (work.prizeYen != null && work.status !== "none") {
    lines.push(
      `【VISCUM】${planLabel ?? "コンペ"} · 褒賞 ${formatYen(work.prizeYen)}`,
    );
  } else {
    lines.push(`【VISCUM】コメント歓迎`);
  }

  lines.push(work.title.trim() || "（タイトル）", url);

  const prompts = (work.prompts ?? []).map((p) => p.trim()).filter(Boolean);
  if (prompts.length > 0) {
    lines.push("", ...prompts.map((p) => `・${p}`));
  } else if (work.plan === "public_boost") {
    lines.push(
      "",
      "ストア／拡張／SNSなど公開の場所への正直な反応・投稿を募集（記入後に報告。褒賞はシーダーが選ぶ／全員払いではない）。",
    );
  } else if (work.prizeYen != null && work.status !== "none") {
    lines.push("", "見て書いてくれる人、募集しています。");
  }

  return lines.join("\n");
}
