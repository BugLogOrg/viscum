/** ブラウザ端末内のシード控え（Neon未接続時のB段階フォールバック） */
import { courseById, PUBLIC_BOOST } from "@/data/seed-courses";
import { getWork, type Work } from "@/data/dummy-works";

export type LocalSeed = {
  id: string;
  seederHandle: string;
  /** 投稿時点のアカウント名（表示用） */
  seederAccountName?: string;
  title: string;
  description: string;
  focusNote?: string;
  externalUrl: string;
  tags: string[];
  status: "none" | "open" | "pay_soon" | "closed";
  prizeYen?: number;
  closesInDays?: number;
  /** 公開ブースト（プランD）デモフラグ */
  extReviewOn?: boolean;
  extPrizeYen?: number;
  /** バッジ用（ADR-031 4コース） */
  planLabel?: string;
  /** コースID（共有文・詳細の plan 用） */
  seedPlan?: "free_comment" | "first_impression" | "brush_up" | "public_boost";
  /** サムネ（data URL。blob URL は永続化不可） */
  thumbDataUrl?: string;
  /**
   * トップの「すべて」等に載せるか。
   * 新規シードは false（未公開）。全体告知で true にする。
   * 未定義＝移行前データ扱いで公開済みとみなす。
   */
  listedOnShelf?: boolean;
  /**
   * ADR-038: 棚レーンと直依頼レーンは別物。
   * direct_request は棚に出さない（ID も drq_ 接頭）。
   */
  lane?: "shelf" | "direct_request";
  viewCount: number;
  emoCount: number;
  bookmarkCount: number;
  commentCount: number;
  createdAt: string;
  /** 一旦保存・内容更新の日時（未設定＝作成時のみ） */
  updatedAt?: string;
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

/** アカウント名変更時、自シードの表示用スナップショットも揃える */
export function syncSeederAccountNameOnSeeds(
  handle: string,
  accountName: string,
): number {
  const h = handle.replace(/^@/, "").trim().toLowerCase();
  const name = accountName.trim();
  if (!h || !name || typeof window === "undefined") return 0;
  const seeds = readLocalSeeds();
  let changed = 0;
  const next = seeds.map((s) => {
    if (s.seederHandle.replace(/^@/, "").trim().toLowerCase() !== h) return s;
    if ((s.seederAccountName ?? "").trim() === name) return s;
    changed += 1;
    return { ...s, seederAccountName: name };
  });
  if (changed > 0) writeLocalSeeds(next);
  return changed;
}

export function isDirectRequestLane(seed: Pick<LocalSeed, "id" | "lane">): boolean {
  return seed.lane === "direct_request" || seed.id.startsWith("drq_");
}

export function addLocalSeed(
  seed: Omit<
    LocalSeed,
    "id" | "viewCount" | "emoCount" | "bookmarkCount" | "commentCount" | "createdAt"
  >,
): LocalSeed {
  const lane = seed.lane ?? "shelf";
  const row: LocalSeed = {
    ...seed,
    lane,
    id:
      lane === "direct_request"
        ? `drq_${Date.now().toString(36)}`
        : `local_${Date.now().toString(36)}`,
    listedOnShelf:
      lane === "direct_request" ? false : (seed.listedOnShelf ?? false),
    viewCount: 0,
    emoCount: 0,
    bookmarkCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const next = [row, ...readLocalSeeds()];
  writeLocalSeeds(next);
  return row;
}

/** トップ棚に載せる＝公開（直依頼レーンは不可） */
export function publishLocalSeedToShelf(id: string): LocalSeed | null {
  const seeds = readLocalSeeds();
  const i = seeds.findIndex((s) => s.id === id);
  if (i < 0) return null;
  if (isDirectRequestLane(seeds[i])) return null;
  seeds[i] = {
    ...seeds[i],
    listedOnShelf: true,
    lane: "shelf",
    updatedAt: new Date().toISOString(),
  };
  writeLocalSeeds(seeds);
  return seeds[i];
}

/** 棚に出す対象か（直依頼レーンは常に false。未定義 listed は移行前＝公開扱い） */
export function isLocalSeedListed(seed: LocalSeed): boolean {
  if (isDirectRequestLane(seed)) return false;
  return seed.listedOnShelf !== false;
}

/** 端末内のローカル作品IDか（棚 local_ ／直依頼 drq_） */
export function isClientSeedId(id: string): boolean {
  return id.startsWith("local_") || id.startsWith("drq_");
}

function normalizeHandle(h: string): string {
  return h.replace(/^@/, "").trim().toLowerCase();
}

/** シーダー本人か */
export function isLocalSeedOwner(
  seed: LocalSeed,
  actorHandle: string | null | undefined,
): boolean {
  if (!actorHandle) return false;
  return normalizeHandle(seed.seederHandle) === normalizeHandle(actorHandle);
}

export type LocalSeedOwnerResult =
  | { ok: true; seed: LocalSeed }
  | { ok: false; error: string };

/** 棚から外す（未公開に戻す）。本人のみ */
export function unlistLocalSeed(
  id: string,
  actorHandle: string,
): LocalSeedOwnerResult {
  const seeds = readLocalSeeds();
  const i = seeds.findIndex((s) => s.id === id);
  if (i < 0) return { ok: false, error: "見つかりません" };
  if (!isLocalSeedOwner(seeds[i], actorHandle)) {
    return { ok: false, error: "シーダー本人だけ操作できます" };
  }
  seeds[i] = {
    ...seeds[i],
    listedOnShelf: false,
    updatedAt: new Date().toISOString(),
  };
  writeLocalSeeds(seeds);
  return { ok: true, seed: seeds[i] };
}

/** シードを削除。本人のみ。デモ棚IDは消さない */
export function deleteLocalSeed(
  id: string,
  actorHandle: string,
): LocalSeedOwnerResult {
  if (isDemoSeed(id)) {
    return { ok: false, error: "表示デモは「デモを消す」からまとめて外してください" };
  }
  const seeds = readLocalSeeds();
  const i = seeds.findIndex((s) => s.id === id);
  if (i < 0) return { ok: false, error: "見つかりません" };
  const seed = seeds[i];
  if (!isLocalSeedOwner(seed, actorHandle)) {
    return { ok: false, error: "シーダー本人だけ削除できます" };
  }
  writeLocalSeeds(seeds.filter((_, j) => j !== i));
  return { ok: true, seed };
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

/** 表示デモ用。id は `/w/[id]` のダミー作品と一致させ、クリックで詳細へ行けるようにする */
const DEMO_SEED_IDS = [
  "promo-15s",
  "novel-open",
  "recipe-site",
  "chrome-ext-store",
] as const;

/** /dashboard の見た目確認用。4コース各1本 */
export function installDemoSeeds(seederHandle: string): LocalSeed[] {
  const demos: LocalSeed[] = [
    {
      id: "promo-15s",
      seederHandle,
      title:
        "宅配ボックスIoTの15秒プロモ。冒頭1秒で何の製品か分かるかだけ見てほしい（初見レビュー）",
      description: "表示デモ用。初見レビュー ¥5,000。",
      focusNote: courseById("first_impression").questions.join("\n"),
      externalUrl: "https://example.com/promo",
      tags: ["動画"],
      status: "open",
      planLabel: "初見レビュー",
      prizeYen: 5000,
      closesInDays: 5,
      viewCount: 428,
      emoCount: 36,
      bookmarkCount: 19,
      commentCount: 12,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "novel-open",
      seederHandle,
      title:
        "短編『団地の屋上』冒頭の改善提案。続きが読みたくなるか、一人目の印象は残るか",
      description: "表示デモ用。改善提案 ¥10,000。",
      focusNote: courseById("brush_up").questions.join("\n"),
      externalUrl: "https://example.com/novel",
      tags: ["小説"],
      status: "open",
      planLabel: "改善提案",
      prizeYen: 10000,
      closesInDays: 10,
      viewCount: 91,
      emoCount: 7,
      bookmarkCount: 4,
      commentCount: 3,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "recipe-site",
      seederHandle,
      title:
        "5分レシピ棚の公開。検索せずにTonightが出るかだけコメント歓迎（無料コメント）",
      description: "表示デモ用。無料コメント。ほぼ届いていない例。",
      externalUrl: "https://example.com/recipe",
      tags: ["Web"],
      status: "none",
      planLabel: "無料コメント",
      viewCount: 14,
      emoCount: 0,
      bookmarkCount: 1,
      commentCount: 0,
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    {
      id: "chrome-ext-store",
      seederHandle,
      title:
        "タブ整理Chrome拡張の公開ブースト。ストア／SNSへ正直な反応→報告（予算¥30,000）",
      description: "表示デモ用。公開ブースト。記入後報告→選んで褒賞。",
      focusNote: PUBLIC_BOOST.criteria.join("\n"),
      externalUrl: "https://example.com/ext",
      tags: ["アプリ"],
      status: "open",
      planLabel: "公開ブースト",
      extReviewOn: true,
      extPrizeYen: 30000,
      prizeYen: 30000,
      closesInDays: 7,
      viewCount: 203,
      emoCount: 11,
      bookmarkCount: 8,
      commentCount: 1,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const demoIdSet = new Set<string>(DEMO_SEED_IDS);
  const rest = readLocalSeeds().filter((s) => {
    if (s.seederHandle !== seederHandle) return true;
    if (demoIdSet.has(s.id)) return false;
    // 旧表示デモ（demo_seed_*）も入れ直し時に掃除
    if (s.id.startsWith("demo_seed_")) return false;
    // 旧3本セットの note-clip も入れ直し時に掃除
    if (s.id === "note-clip") return false;
    return true;
  });
  const next = [...demos, ...rest];
  writeLocalSeeds(next);
  return demos;
}

export function clearDemoSeeds(seederHandle: string) {
  const demoIdSet = new Set<string>(DEMO_SEED_IDS);
  writeLocalSeeds(
    readLocalSeeds().filter((s) => {
      if (s.seederHandle !== seederHandle) return true;
      if (demoIdSet.has(s.id)) return false;
      if (s.id.startsWith("demo_seed_")) return false;
      if (s.id === "note-clip") return false;
      return true;
    }),
  );
}

export function hasDemoSeeds(seederHandle: string) {
  const demoIdSet = new Set<string>(DEMO_SEED_IDS);
  return readLocalSeeds().some(
    (s) => demoIdSet.has(s.id) && s.seederHandle === seederHandle,
  );
}

export function isDemoSeed(id: string) {
  return (DEMO_SEED_IDS as readonly string[]).includes(id);
}

/** 場内シード詳細は常に `/w/[id]`（local_* 含む） */
export function workDetailHref(seed: LocalSeed): string {
  return `/w/${seed.id}`;
}

/** ダッシュボード用：作成・保存日時の表示（例: 2026/8/27 15:10） */
export function formatLocalSeedStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** 最終保存（一旦保存）日時。未設定なら作成日 */
export function localSeedSavedAt(seed: Pick<LocalSeed, "createdAt" | "updatedAt">): string {
  return seed.updatedAt || seed.createdAt;
}

/** 締切絶対時刻（作成日＋closesInDays）。なければ null */
export function localSeedClosesAt(
  seed: Pick<LocalSeed, "createdAt" | "closesInDays">,
): Date | null {
  if (seed.closesInDays == null || seed.closesInDays <= 0) return null;
  const ms = Date.parse(seed.createdAt);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms + seed.closesInDays * 86_400_000);
}

/** 直依頼／DM用に LocalSeed → Work 形へ（デモ詳細なしでもタイトルを載せる） */
export function workFromLocalSeed(seed: LocalSeed): Work {
  const plan =
    seed.seedPlan ??
    (seed.extReviewOn
      ? ("public_boost" as const)
      : seed.status === "none" || seed.prizeYen == null
        ? ("free_comment" as const)
        : ("first_impression" as const));
  const createdMs = Date.parse(seed.createdAt);
  const hoursAgo = Number.isFinite(createdMs)
    ? Math.max(0, (Date.now() - createdMs) / 3_600_000)
    : 0;
  return {
    id: seed.id,
    title: seed.title,
    tagline: seed.title.slice(0, 100),
    seeder: seed.seederHandle,
    seederAccountName: seed.seederAccountName,
    tags: seed.tags,
    status: seed.status,
    plan,
    prizeYen: seed.prizeYen,
    hoursAgo,
    closesInHours:
      seed.closesInDays != null ? seed.closesInDays * 24 : undefined,
    description: seed.description,
    prompts: seed.focusNote
      ? seed.focusNote.split("\n").map((s) => s.trim()).filter(Boolean)
      : undefined,
    externalUrl: seed.externalUrl,
    thumbTone: "leaf",
    thumbUrl: seed.thumbDataUrl,
    comments: [],
    /** 自分のシードは合成デモ件数を載せない */
    sukiCount: seed.emoCount,
    bookmarkCount: seed.bookmarkCount,
  };
}

/** ダミー作品 or 端末内シード */
export function resolveWorkClient(id: string): Work | null {
  const demo = getWork(id);
  if (demo) return demo;
  const seed = readLocalSeeds().find((s) => s.id === id);
  return seed ? workFromLocalSeed(seed) : null;
}

/** ご依頼DMの作品名表示。local_* は端末の最新タイトル、それ以外は保存値を尊重 */
export function displayRequestWorkTitle(
  workId: string,
  storedTitle: string,
): string {
  if (workId.startsWith("local_") || workId.startsWith("drq_")) {
    const live = resolveWorkClient(workId)?.title?.trim();
    if (live) return live;
  }
  // デモ作品IDでも getWork の長文タイトルで上書きしない（名残・ごっちゃ防止）
  return storedTitle.trim() || workId;
}

/** ご依頼DM・共有から作品へ辿る主リンク（常に場内 `/w/[id]`） */
export function requestWorkPrimaryHref(workId: string): string | null {
  if (!workId) return null;
  return `/w/${encodeURIComponent(workId)}`;
}

