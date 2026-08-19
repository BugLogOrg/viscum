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
