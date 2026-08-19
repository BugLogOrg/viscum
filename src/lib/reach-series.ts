import { isDemoSeed, type LocalSeed } from "@/lib/local-seeds";

/** 直近7日の累計（折れ線用）。Neon前はデモ／合成のみ */
export type ReachSeries = {
  labels: string[];
  views: number[];
  emo: number[];
  bookmark: number[];
  comment: number[];
  /** 仮データ（表示デモ or ゼロ埋め） */
  synthetic: boolean;
};

const DAY_LABELS = ["6日前", "5日前", "4日前", "3日前", "おととい", "昨日", "今日"];

/** 表示デモ：届きの差が折れ線でも分かる系列 */
const DEMO_SERIES: Record<string, Omit<ReachSeries, "labels" | "synthetic">> = {
  "promo-15s": {
    views: [48, 96, 155, 230, 310, 378, 428],
    emo: [2, 5, 9, 15, 22, 29, 36],
    bookmark: [1, 3, 6, 9, 13, 16, 19],
    comment: [0, 1, 3, 5, 7, 10, 12],
  },
  "note-clip": {
    views: [8, 18, 32, 48, 62, 78, 91],
    emo: [0, 1, 2, 3, 4, 6, 7],
    bookmark: [0, 0, 1, 2, 3, 3, 4],
    comment: [0, 0, 1, 1, 2, 2, 3],
  },
  "recipe-site": {
    views: [2, 3, 5, 7, 9, 12, 14],
    emo: [0, 0, 0, 0, 0, 0, 0],
    bookmark: [0, 0, 0, 0, 0, 1, 1],
    comment: [0, 0, 0, 0, 0, 0, 0],
  },
};

function padToSeven(total: number): number[] {
  if (total <= 0) return [0, 0, 0, 0, 0, 0, 0];
  const out: number[] = [];
  for (let i = 0; i < 7; i++) {
    const t = (i + 1) / 7;
    out.push(Math.round(total * t * t));
  }
  out[6] = total;
  return out;
}

export function getReachSeries(seed: LocalSeed): ReachSeries {
  const demo = DEMO_SERIES[seed.id];
  if (demo) {
    return { labels: DAY_LABELS, ...demo, synthetic: true };
  }

  return {
    labels: DAY_LABELS,
    views: padToSeven(seed.viewCount),
    emo: padToSeven(seed.emoCount),
    bookmark: padToSeven(seed.bookmarkCount),
    comment: padToSeven(seed.commentCount),
    synthetic: !isDemoSeed(seed.id),
  };
}

export function dayDelta(series: number[]): number {
  if (series.length < 2) return 0;
  return series[series.length - 1]! - series[series.length - 2]!;
}

export function formatDelta(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${n}`;
  return "±0";
}
