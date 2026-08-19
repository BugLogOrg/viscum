import { DUMMY_WORKS, type Work } from "@/data/dummy-works";

export type SuggestedSeeder = {
  handle: string;
  /** フィードと同じ一文字タイル用 */
  thumbTone: Work["thumbTone"];
  glyph: string;
  blurb: string;
  workCount: number;
};

const BLURBS: Record<string, string> = {
  mdb: "VISCUMの見本シード。場の型を見るのに向く",
  ayu: "朝活・短尺まわりのサンプル",
  ken: "ツール・個人開発系の見本",
  sana: "小説・長文まわり",
  neo: "デザイン寄りのサンプル",
};

/** 棚デモからおすすめシーダーを組み立て（本物の活発ユーザーが出るまでの仮） */
export function getSuggestedSeeders(limit = 5): SuggestedSeeder[] {
  const map = new Map<string, SuggestedSeeder>();
  for (const w of DUMMY_WORKS) {
    const key = w.seeder.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.workCount += 1;
      continue;
    }
    map.set(key, {
      handle: w.seeder,
      thumbTone: w.thumbTone,
      glyph: w.title.slice(0, 1),
      blurb: BLURBS[key] ?? "デモ棚に作品あり",
      workCount: 1,
    });
  }
  const preferred = ["mdb", "ayu", "ken", "sana", "neo"];
  const ordered: SuggestedSeeder[] = [];
  for (const p of preferred) {
    const s = map.get(p);
    if (s) ordered.push(s);
  }
  for (const s of map.values()) {
    if (!preferred.includes(s.handle.toLowerCase())) ordered.push(s);
  }
  return ordered.slice(0, limit);
}

export const THUMB_TONE_CLASS: Record<Work["thumbTone"], string> = {
  leaf: "bg-viscum-leaf-deep",
  moss: "bg-viscum-moss",
  berry: "bg-viscum-berry",
  bark: "bg-viscum-bark",
  trunk: "bg-viscum-trunk",
};
