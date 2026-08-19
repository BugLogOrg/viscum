import { type LocalSeed } from "@/lib/local-seeds";

/** 1日分の届き（YouTubeアナリティクスと同様・日次） */
export type ReachDay = {
  /** YYYY-MM-DD */
  date: string;
  views: number;
  emo: number;
  bookmark: number;
  comment: number;
};

export type ReachSeries = {
  days: ReachDay[];
  synthetic: boolean;
};

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"] as const;

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

/** 今日を含む直近 n 日の YYYY-MM-DD（古い→新しい） */
export function recentDateKeys(n: number, end = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    keys.push(
      `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    );
  }
  return keys;
}

/** 表・ツールチップ用：2026年8月14日(金) */
export function formatDateJa(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  return `${y}年${m}月${d}日(${WEEKDAY[dt.getDay()]})`;
}

/** 軸用：08/14 */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
}

/** 軸用：2026/08/14 */
export function formatDateAxis(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}/${m}/${d}`;
}

type DailyPack = {
  views: number[];
  emo: number[];
  bookmark: number[];
  comment: number[];
};

/** 14日・日次。届き良い例は序盤スパイク→落ち着き（YTアナリティクスっぽい形） */
const DEMO_DAILY: Record<string, DailyPack> = {
  "promo-15s": {
    views: [22, 41, 38, 9, 6, 14, 18, 11, 15, 8, 19, 12, 7, 8],
    emo: [1, 4, 5, 1, 0, 2, 3, 2, 3, 1, 4, 3, 1, 2],
    bookmark: [0, 2, 3, 1, 0, 1, 2, 1, 2, 1, 2, 1, 1, 1],
    comment: [0, 2, 2, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  },
  "note-clip": {
    views: [3, 5, 8, 6, 4, 9, 7, 11, 8, 6, 10, 5, 4, 5],
    emo: [0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1],
    bookmark: [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
    comment: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  },
  "recipe-site": {
    views: [1, 0, 2, 1, 0, 1, 2, 0, 1, 1, 0, 2, 1, 2],
    emo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bookmark: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    comment: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
};

function packToDays(dates: string[], pack: DailyPack): ReachDay[] {
  return dates.map((date, i) => ({
    date,
    views: pack.views[i] ?? 0,
    emo: pack.emo[i] ?? 0,
    bookmark: pack.bookmark[i] ?? 0,
    comment: pack.comment[i] ?? 0,
  }));
}

/** 合計から粗い日次を合成（本物の日次は Neon 後） */
function synthesizeDaily(seed: LocalSeed, n: number): DailyPack {
  const weights = Array.from({ length: n }, (_, i) => 0.4 + (i / n) * 0.8);
  const sumW = weights.reduce((a, b) => a + b, 0);

  function split(total: number): number[] {
    if (total <= 0) return Array(n).fill(0);
    const raw = weights.map((w) => (total * w) / sumW);
    const floored = raw.map((v) => Math.floor(v));
    let left = total - floored.reduce((a, b) => a + b, 0);
    for (let i = n - 1; i >= 0 && left > 0; i--, left--) {
      floored[i]! += 1;
    }
    return floored;
  }

  return {
    views: split(seed.viewCount),
    emo: split(seed.emoCount),
    bookmark: split(seed.bookmarkCount),
    comment: split(seed.commentCount),
  };
}

const WINDOW = 14;

export function getReachSeries(seed: LocalSeed): ReachSeries {
  const dates = recentDateKeys(WINDOW);
  const demo = DEMO_DAILY[seed.id];
  if (demo) {
    return { days: packToDays(dates, demo), synthetic: true };
  }
  return {
    days: packToDays(dates, synthesizeDaily(seed, WINDOW)),
    synthetic: true,
  };
}

export function periodTotals(days: ReachDay[]) {
  return days.reduce(
    (acc, d) => ({
      views: acc.views + d.views,
      emo: acc.emo + d.emo,
      bookmark: acc.bookmark + d.bookmark,
      comment: acc.comment + d.comment,
    }),
    { views: 0, emo: 0, bookmark: 0, comment: 0 },
  );
}

/** 今日（系列末尾）の日次 */
export function todayDaily(days: ReachDay[]): ReachDay | null {
  return days.length ? days[days.length - 1]! : null;
}

export function formatDelta(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${n}`;
  return "±0";
}
