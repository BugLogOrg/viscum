import { and, asc, eq, gt, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { works } from "@/db/schema";
import {
  PIN_DURATION_MS,
  PIN_MAX_ACTIVE,
  PIN_MAX_CONSECUTIVE_WEEKS,
} from "@/lib/seeder-pricing";

/**
 * 注目ピンの枠管理（ADR-069）。
 * - 有効 = status=open かつ pinned_until > now()
 * - 仮押さえ = pin_hold_until > now()（Checkout 中の30分）
 * - 空き判定は「有効＋仮押さえ」で数える。cron なし・表示条件だけで自然に外れる
 */
export type PinAvailability = {
  max: number;
  /** 有効ピン本数（仮押さえ除く） */
  active: number;
  /** 仮押さえ本数 */
  holding: number;
  /** 新規に入れる余地があるか（自分の延長は別判定） */
  canPin: boolean;
  /** 満席のとき、いちばん早く空く時刻 */
  nextFreeAtIso: string | null;
};

export async function getPinAvailability(opts?: {
  /** 自分のコンペは数えない（延長・再確認用） */
  excludeWorkId?: string;
}): Promise<PinAvailability> {
  const db = getDb();
  if (!db) {
    return {
      max: PIN_MAX_ACTIVE,
      active: 0,
      holding: 0,
      canPin: false,
      nextFreeAtIso: null,
    };
  }
  const now = new Date();
  const base = and(
    eq(works.status, "open"),
    eq(works.listedOnShelf, true),
    or(gt(works.pinnedUntil, now), gt(works.pinHoldUntil, now)),
    ...(opts?.excludeWorkId ? [ne(works.id, opts.excludeWorkId)] : []),
  );
  const rows = await db
    .select({
      id: works.id,
      pinnedUntil: works.pinnedUntil,
      pinHoldUntil: works.pinHoldUntil,
    })
    .from(works)
    .where(base)
    .orderBy(asc(works.pinnedUntil));

  let active = 0;
  let holding = 0;
  const ends: number[] = [];
  for (const r of rows) {
    const pinnedActive = r.pinnedUntil != null && r.pinnedUntil > now;
    const holdActive = r.pinHoldUntil != null && r.pinHoldUntil > now;
    if (pinnedActive) {
      active += 1;
      ends.push(r.pinnedUntil!.getTime());
    } else if (holdActive) {
      holding += 1;
      // 仮押さえは最長30分＋7日で空く見込み
      ends.push(r.pinHoldUntil!.getTime() + PIN_DURATION_MS);
    }
  }
  const used = active + holding;
  const canPin = used < PIN_MAX_ACTIVE;
  ends.sort((a, b) => a - b);
  const nextFreeAtIso =
    canPin || ends.length === 0 ? null : new Date(ends[0]).toISOString();
  return { max: PIN_MAX_ACTIVE, active, holding, canPin, nextFreeAtIso };
}

/**
 * 延長可否: いま有効で、まだ「連続2週」に達していないか。
 * pinned_until - now が 1週間以内なら 1週目 → 延長可。超えていれば既に延長済み。
 */
export function canExtendPin(pinnedUntil: Date | null, now = new Date()): boolean {
  if (!pinnedUntil || pinnedUntil <= now) return false;
  const remaining = pinnedUntil.getTime() - now.getTime();
  return remaining <= PIN_DURATION_MS * (PIN_MAX_CONSECUTIVE_WEEKS - 1);
}

/** 購入確定: pinned_until = max(now, 既存) + 7d、仮押さえ解除 */
export async function applyPinPurchase(workId: string): Promise<Date | null> {
  const db = getDb();
  if (!db) return null;
  const now = new Date();
  const rows = await db
    .select({ pinnedUntil: works.pinnedUntil })
    .from(works)
    .where(eq(works.id, workId))
    .limit(1);
  const cur = rows[0]?.pinnedUntil ?? null;
  const from = cur && cur > now ? cur : now;
  const next = new Date(from.getTime() + PIN_DURATION_MS);
  await db
    .update(works)
    .set({ pinnedUntil: next, pinHoldUntil: null, updatedAt: now })
    .where(eq(works.id, workId));
  return next;
}

/** 仮押さえ解除（Checkout 期限切れ・失敗・返金） */
export async function releasePinHold(workId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(works)
    .set({ pinHoldUntil: null })
    .where(and(eq(works.id, workId), sql`${works.pinHoldUntil} is not null`));
}
