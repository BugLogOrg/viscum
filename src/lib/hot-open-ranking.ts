import {
  DUMMY_WORKS,
  getWorkReactionCounts,
  type Work,
} from "@/data/dummy-works";
import {
  isLocalSeedListed,
  readLocalSeeds,
  workFromLocalSeed,
} from "@/lib/local-seeds";

/**
 * 開催中ホット（仮式・はてな型）。
 * 信用スコア化しない。発見並び専用。
 *
 * score = (コメント + β·気になる) / (経過h + γ)^δ
 *
 * スキは使わない（ADR-036）。現状は作品単位集計＋投稿経過。
 */
export const HOT_OPEN_SCORE = {
  /** 気になるの重み（コメント＝1） */
  beta: 0.4,
  /** 減衰オフセット（時間） */
  gamma: 2,
  /** 減衰指数 */
  delta: 1.35,
  defaultLimit: 6,
} as const;

export function hotOpenScore(work: Work): number {
  const { bookmark } = getWorkReactionCounts(work);
  const comments = work.comments?.length ?? 0;
  const heat = comments + HOT_OPEN_SCORE.beta * bookmark;
  const hours = Math.max(0, work.hoursAgo);
  return heat / (hours + HOT_OPEN_SCORE.gamma) ** HOT_OPEN_SCORE.delta;
}

function compareHotOpen(a: Work, b: Work): number {
  const sa = hotOpenScore(a);
  const sb = hotOpenScore(b);
  if (sb !== sa) return sb - sa;
  const ca = a.closesInHours ?? Number.POSITIVE_INFINITY;
  const cb = b.closesInHours ?? Number.POSITIVE_INFINITY;
  if (ca !== cb) return ca - cb;
  return a.hoursAgo - b.hoursAgo;
}

/** 公開済み端末内シード＋デモ（FeedClient と同じ棚） */
export function loadClientShelfWorks(): Work[] {
  if (typeof window === "undefined") return [...DUMMY_WORKS];
  const locals = readLocalSeeds()
    .filter((s) => isLocalSeedListed(s))
    .map(workFromLocalSeed);
  const demoIds = new Set(DUMMY_WORKS.map((w) => w.id));
  const onlyLocals = locals.filter((w) => !demoIds.has(w.id));
  return [...onlyLocals, ...DUMMY_WORKS];
}

export function rankHotOpenWorks(
  works: Work[],
  opts?: { excludeId?: string; limit?: number },
): Work[] {
  const limit = opts?.limit ?? HOT_OPEN_SCORE.defaultLimit;
  const excludeId = opts?.excludeId;
  return works
    .filter((w) => w.status === "open" && w.id !== excludeId)
    .slice()
    .sort(compareHotOpen)
    .slice(0, limit);
}
