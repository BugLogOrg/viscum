/** ADR-031/033: 場内コンペと公開ブーストは別企画。Dは¥30k一択・稀少褒賞 */

/** 場内コメントコンペ用（プランB） */
export type SeedCourseId = "first_impression" | "brush_up";

export type SeedCourse = {
  id: SeedCourseId;
  name: string;
  yen: 5000 | 10000;
  purpose: string;
  questions: string[];
};

export const SEED_COURSES: SeedCourse[] = [
  {
    id: "first_impression",
    name: "初見チェック",
    yen: 5000,
    purpose: "初めて見た人に「どう見えたか」を聞く",
    questions: [
      "何の作品／サービスだと思いましたか？",
      "どんな人向けだと思いましたか？",
      "興味を持ちましたか？理由も一言",
      "一番気になったところはどこですか？",
    ],
  },
  {
    id: "brush_up",
    name: "改善チェック",
    yen: 10000,
    purpose: "どこを直せば伝わるかを聞く",
    questions: [
      "良かったところは？",
      "違和感があったところは？（理由つき）",
      "分かりにくかったところは？",
      "自分ならどう直しますか？（代案）",
    ],
  },
];

export const MAX_COURSE_QUESTIONS = 6;

export function courseById(id: SeedCourseId): SeedCourse {
  return SEED_COURSES.find((c) => c.id === id) ?? SEED_COURSES[0];
}

/**
 * 公開ブースト（プランD）— ¥30,000一択。
 * 記入後報告→シーダーが選ぶ（全員払いしない）。依頼検収型にしない。
 */
export const PUBLIC_BOOST = {
  name: "公開ブースト",
  yen: 30000 as const,
  purpose: "外の公開場所へ正直な反応・投稿を募り、初動を押し上げる",
  criteria: [
    "指定した公開場所（ストア／拡張／SNS等）へ正直な反応・投稿を残す",
    "実利用したうえで書く（触っていない評価は除外の目安）",
    "シーダー指定の観点に触れる",
    "やらせ・星の売買保証は不可。必要な開示があれば付ける",
    "記入後に投稿URL等を報告する。褒賞はシーダーが選ぶ（全員払いではない）",
  ],
} as const;
