import { DUMMY_WORKS, type Work } from "@/data/dummy-works";

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

/** 棚デモからおすすめシーダーを組み立て（本物の活発ユーザーが出るまでの仮） */
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

export const THUMB_TONE_CLASS: Record<Work["thumbTone"], string> = {
  leaf: "bg-viscum-leaf-deep",
  moss: "bg-viscum-moss",
  berry: "bg-viscum-berry",
  bark: "bg-viscum-bark",
  trunk: "bg-viscum-trunk",
};
