import type { DemoSeedPlan } from "@/data/dummy-works";
import { courseById, PUBLIC_BOOST } from "@/data/seed-courses";

/** 褒賞を渡せるプラン（無料コメントは不可） */
export function planAllowsPrize(plan?: DemoSeedPlan | null): boolean {
  return (
    plan === "first_impression" ||
    plan === "brush_up" ||
    plan === "public_boost"
  );
}

/**
 * 作品の褒賞額。DBの prize_yen を優先し、欠けていればプラン既定（5k／10k／30k）。
 * 無料コメントは常に null。
 */
export function resolveWorkPrizeYen(
  plan?: DemoSeedPlan | null,
  prizeYen?: number | null,
): number | null {
  if (plan === "free_comment") return null;
  if (!planAllowsPrize(plan) && (prizeYen == null || prizeYen <= 0)) {
    return null;
  }
  if (typeof prizeYen === "number" && Number.isFinite(prizeYen) && prizeYen >= 5000) {
    return Math.round(prizeYen);
  }
  if (plan === "first_impression") return courseById("first_impression").yen;
  if (plan === "brush_up") return courseById("brush_up").yen;
  if (plan === "public_boost") return PUBLIC_BOOST.yen;
  return null;
}
