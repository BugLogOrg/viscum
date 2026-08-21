import { planBadgeLabel, formatYen, type Work } from "@/data/dummy-works";

/** X（@viscum_org）告知用。280字以内に収める */
export function buildXAnnounceText(
  input: {
    id: string;
    title: string;
    plan?: Work["plan"];
    prizeYen?: number | null;
    status?: Work["status"];
  },
  origin: string,
): string {
  const base = origin.replace(/\/$/, "") || "https://viscum.vercel.app";
  const url = `${base}/w/${encodeURIComponent(input.id)}`;
  const planLabel = planBadgeLabel(input.plan);
  const head =
    input.prizeYen != null && input.status !== "none"
      ? `【VISCUM】${planLabel ?? "コンペ"} · ${formatYen(input.prizeYen)}`
      : `【VISCUM】${planLabel ?? "コメント歓迎"}`;

  const budget = 280 - head.length - url.length - 2; // \n\n
  let title = (input.title || "（無題）").trim().replace(/\s+/g, " ");
  if (title.length > budget) {
    title = `${title.slice(0, Math.max(0, budget - 1))}…`;
  }
  return `${head}\n${title}\n${url}`;
}
