import { DUMMY_WORKS, type Work } from "@/data/dummy-works";
import { listLocalProfiles } from "@/lib/local-profile";

export type DemoSeederProfile = {
  handle: string;
  displayName: string;
  bio: string;
  thumbTone: Work["thumbTone"];
  glyph: string;
};

export type SuggestedSeeder = DemoSeederProfile & {
  workCount: number;
};

/** デモ棚の人物像（handle は dummy-works の seeder と揃える） */
const PROFILES: DemoSeederProfile[] = [
  {
    handle: "tori",
    displayName: "鳥居はな",
    bio: "週末に個人アプリを出す人。初見の迷いを一言ほしい",
    thumbTone: "leaf",
    glyph: "鳥",
  },
  {
    handle: "ayu",
    displayName: "鮎川あさ",
    bio: "朝活の短い動画。テンポと掴みの感想ください",
    thumbTone: "moss",
    glyph: "鮎",
  },
  {
    handle: "ken",
    displayName: "健一郎",
    bio: "個人ツール屋。使い心地のツッコミ歓迎",
    thumbTone: "berry",
    glyph: "健",
  },
  {
    handle: "sana",
    displayName: "沙奈",
    bio: "短編小説。読み心地と途中離脱ポイントが知りたい",
    thumbTone: "trunk",
    glyph: "沙",
  },
  {
    handle: "neo",
    displayName: "根尾レン",
    bio: "UIの第一印象集め中。色と余白の違和感ください",
    thumbTone: "bark",
    glyph: "根",
  },
];

export function getDemoSeederProfile(
  handle: string,
): DemoSeederProfile | undefined {
  const key = handle.replace(/^@/, "").toLowerCase();
  return PROFILES.find((p) => p.handle.toLowerCase() === key);
}

/** 表示用：アカウント名＋@英語ID（同名なら @ID のみ） */
export function accountLabelForHandle(handle: string): {
  handle: string;
  accountName: string;
  line: string;
} {
  const h = handle.replace(/^@/, "").trim();
  const demo = getDemoSeederProfile(h);
  const accountName = demo?.displayName ?? h;
  const line =
    accountName.toLowerCase() === h.toLowerCase()
      ? `@${h}`
      : `${accountName} @${h}`;
  return { handle: h, accountName, line };
}

/** デモ棚の英語ID。実アカウント登録では使えない */
export function isReservedDemoHandle(handle: string): boolean {
  return Boolean(getDemoSeederProfile(handle));
}

export function listReservedDemoHandles(): string[] {
  return PROFILES.map((p) => p.handle);
}

/** 棚デモからおすすめユーザーを組み立て（本物の活発ユーザーが出るまでの仮） */
export function getSuggestedSeeders(limit = 5): SuggestedSeeder[] {
  const counts = new Map<string, number>();
  for (const w of DUMMY_WORKS) {
    const key = w.seeder.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return PROFILES.filter((p) => counts.has(p.handle.toLowerCase()))
    .map((p) => ({
      ...p,
      workCount: counts.get(p.handle.toLowerCase()) ?? 0,
    }))
    .slice(0, limit);
}

/** 検索用：表示名・@ID でユーザーを拾う（作品の有無に依存しない） */
export function searchDemoUsers(
  query: string,
  limit = 8,
  extras?: { handles?: string[] },
): SuggestedSeeder[] {
  const needle = query.trim().toLowerCase().replace(/^@/, "");
  if (!needle) return [];
  const counts = new Map<string, number>();
  for (const w of DUMMY_WORKS) {
    const key = w.seeder.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const hit = new Map<string, SuggestedSeeder>();

  function put(row: SuggestedSeeder) {
    const key = row.handle.toLowerCase();
    if (hit.has(key)) return;
    hit.set(key, row);
  }

  for (const p of PROFILES) {
    if (
      p.handle.toLowerCase().includes(needle) ||
      p.displayName.toLowerCase().includes(needle)
    ) {
      put({
        ...p,
        workCount: counts.get(p.handle.toLowerCase()) ?? 0,
      });
    }
  }
  for (const w of DUMMY_WORKS) {
    const key = w.seeder.toLowerCase();
    if (!key.includes(needle)) continue;
    const demo = getDemoSeederProfile(key);
    put({
      handle: w.seeder,
      displayName: demo?.displayName ?? w.seeder,
      bio: demo?.bio ?? "",
      thumbTone: demo?.thumbTone ?? w.thumbTone,
      glyph: demo?.glyph ?? w.seeder.slice(0, 1).toUpperCase(),
      workCount: counts.get(key) ?? 0,
    });
  }

  // 作品ゼロの実アカウント（端末プロフィール）
  for (const lp of listLocalProfiles()) {
    const key = lp.handle.replace(/^@/, "").trim().toLowerCase();
    if (!key) continue;
    const name = (lp.accountName ?? "").toLowerCase();
    if (!key.includes(needle) && !name.includes(needle)) continue;
    const demo = getDemoSeederProfile(key);
    put({
      handle: key,
      displayName: lp.accountName?.trim() || demo?.displayName || key,
      bio: lp.bio?.trim() || demo?.bio || "作品はまだありません",
      thumbTone: demo?.thumbTone ?? "leaf",
      glyph: demo?.glyph ?? (lp.accountName?.trim() || key).slice(0, 1),
      workCount: counts.get(key) ?? 0,
    });
  }

  for (const h of extras?.handles ?? []) {
    const key = h.replace(/^@/, "").trim().toLowerCase();
    if (!key || !key.includes(needle)) continue;
    const demo = getDemoSeederProfile(key);
    put({
      handle: key,
      displayName: demo?.displayName ?? key,
      bio: demo?.bio ?? "作品はまだありません",
      thumbTone: demo?.thumbTone ?? "leaf",
      glyph: demo?.glyph ?? key.slice(0, 1).toUpperCase(),
      workCount: counts.get(key) ?? 0,
    });
  }

  return [...hit.values()].slice(0, limit);
}

export const THUMB_TONE_CLASS: Record<Work["thumbTone"], string> = {
  leaf: "bg-viscum-leaf-deep",
  moss: "bg-viscum-moss",
  berry: "bg-viscum-berry",
  bark: "bg-viscum-bark",
  trunk: "bg-viscum-trunk",
};
