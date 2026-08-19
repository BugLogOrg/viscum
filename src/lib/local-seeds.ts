/** ブラウザ端末内のシード控え（Neon未接続時のB段階フォールバック） */
export type LocalSeed = {
  id: string;
  seederHandle: string;
  title: string;
  description: string;
  focusNote?: string;
  externalUrl: string;
  tags: string[];
  status: "none" | "open" | "pay_soon" | "closed";
  prizeYen?: number;
  closesInDays?: number;
  viewCount: number;
  emoCount: number;
  bookmarkCount: number;
  commentCount: number;
  createdAt: string;
};

const KEY = "viscum_local_seeds_v1";

export function readLocalSeeds(): LocalSeed[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalSeed[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalSeeds(seeds: LocalSeed[]) {
  localStorage.setItem(KEY, JSON.stringify(seeds.slice(0, 50)));
}

export function addLocalSeed(
  seed: Omit<
    LocalSeed,
    "id" | "viewCount" | "emoCount" | "bookmarkCount" | "commentCount" | "createdAt"
  >,
): LocalSeed {
  const row: LocalSeed = {
    ...seed,
    id: `local_${Date.now().toString(36)}`,
    viewCount: 0,
    emoCount: 0,
    bookmarkCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
  };
  const next = [row, ...readLocalSeeds()];
  writeLocalSeeds(next);
  return row;
}

export function bumpLocalSeedStat(
  id: string,
  field: "viewCount" | "emoCount" | "bookmarkCount",
) {
  const seeds = readLocalSeeds();
  const i = seeds.findIndex((s) => s.id === id);
  if (i < 0) return;
  seeds[i] = { ...seeds[i], [field]: seeds[i][field] + 1 };
  writeLocalSeeds(seeds);
}

const DEMO_PREFIX = "demo_seed_";

/** /me の見た目確認用。シードごとの届き方の差が分かる3本 */
export function installDemoSeeds(seederHandle: string): LocalSeed[] {
  const demos: LocalSeed[] = [
    {
      id: `${DEMO_PREFIX}hot`,
      seederHandle,
      title:
        "宅配ボックスIoTの15秒プロモ。冒頭1秒で何の製品か分かるかだけ見てほしいコンペ",
      description: "表示デモ用。届きが良い例。",
      focusNote: "冒頭1秒\n音なしでも伝わるか",
      externalUrl: "https://example.com/promo",
      tags: ["動画"],
      status: "open",
      prizeYen: 3000,
      closesInDays: 5,
      viewCount: 428,
      emoCount: 36,
      bookmarkCount: 19,
      commentCount: 12,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: `${DEMO_PREFIX}mid`,
      seederHandle,
      title: "メモアプリβのオンボーディング。空白の初見が怖くないかレビュー募集",
      description: "表示デモ用。普通に回っている例。",
      externalUrl: "https://example.com/memo",
      tags: ["アプリ"],
      status: "open",
      prizeYen: 5000,
      closesInDays: 10,
      viewCount: 91,
      emoCount: 7,
      bookmarkCount: 4,
      commentCount: 3,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: `${DEMO_PREFIX}quiet`,
      seederHandle,
      title: "CLIのREADME初見。インストール前の期待値だけコメント歓迎（チップなし）",
      description: "表示デモ用。ほぼ届いていない例。",
      externalUrl: "https://example.com/cli",
      tags: ["ツール"],
      status: "none",
      viewCount: 14,
      emoCount: 0,
      bookmarkCount: 1,
      commentCount: 0,
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
  ];

  const rest = readLocalSeeds().filter(
    (s) => !s.id.startsWith(DEMO_PREFIX) || s.seederHandle !== seederHandle,
  );
  const next = [...demos, ...rest];
  writeLocalSeeds(next);
  return demos;
}

export function clearDemoSeeds(seederHandle: string) {
  writeLocalSeeds(
    readLocalSeeds().filter(
      (s) => !(s.id.startsWith(DEMO_PREFIX) && s.seederHandle === seederHandle),
    ),
  );
}

export function hasDemoSeeds(seederHandle: string) {
  return readLocalSeeds().some(
    (s) => s.id.startsWith(DEMO_PREFIX) && s.seederHandle === seederHandle,
  );
}

export function isDemoSeed(id: string) {
  return id.startsWith(DEMO_PREFIX);
}
