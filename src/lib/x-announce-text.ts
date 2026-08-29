import { planBadgeLabel, formatYen, type Work } from "@/data/dummy-works";
import { resolvePublicOrigin } from "@/lib/public-origin";

/** ADR-037: 公式X自動告知の対象＝有料棚コンペのみ（¥5k／¥10k／¥30k） */
export const PAID_SHELF_PLANS_FOR_X_ANNOUNCE = [
  "first_impression",
  "brush_up",
  "public_boost",
] as const;

export type PaidShelfPlanForXAnnounce =
  (typeof PAID_SHELF_PLANS_FOR_X_ANNOUNCE)[number];

export function isPaidShelfPlanForXAnnounce(
  plan: Work["plan"] | string | null | undefined,
): plan is PaidShelfPlanForXAnnounce {
  return (
    plan === "first_impression" ||
    plan === "brush_up" ||
    plan === "public_boost"
  );
}

/** X（@viscumorg）告知用。280字以内に収める */
export function buildXAnnounceText(
  input: {
    id: string;
    title: string;
    plan?: Work["plan"];
    prizeYen?: number | null;
    status?: Work["status"];
  },
  origin?: string,
): string {
  const base = resolvePublicOrigin(origin);
  const url = `${base}/w/${encodeURIComponent(input.id)}`;
  const planLabel = planBadgeLabel(input.plan);
  const head =
    input.prizeYen != null && input.status !== "none"
      ? `【VISCUM】${planLabel ?? "コンペ"} · 褒賞 ${formatYen(input.prizeYen)}`
      : `【VISCUM】${planLabel ?? "コメント歓迎"}`;

  const budget = 280 - head.length - url.length - 2; // \n\n
  let title = (input.title || "（無題）").trim().replace(/\s+/g, " ");
  if (title.length > budget) {
    title = `${title.slice(0, Math.max(0, budget - 1))}…`;
  }
  return `${head}\n${title}\n${url}`;
}
