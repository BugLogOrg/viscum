/** 加入時・左ナビの推奨専門タグ（正本） */
export const DEMO_SPECIALTIES = [
  "アプリ",
  "小説",
  "動画",
  "デザイン",
  "ツール",
] as const;

export type DemoSpecialty = (typeof DEMO_SPECIALTIES)[number];
