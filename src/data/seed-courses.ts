/** ADR-031: 有料コース＝足場。質問はおすすめ→編集→自由追加 */

export type SeedCourseId = "first_impression" | "brush_up" | "boost";

export type SeedCourse = {
  id: SeedCourseId;
  name: string;
  yen: 5000 | 10000 | 30000;
  /** 集め方の違い（質の保証ではない） */
  purpose: string;
  /** おすすめ質問（シーダーが編集してよい） */
  questions: string[];
};

export const SEED_COURSES: SeedCourse[] = [
  {
    id: "first_impression",
    name: "ファーストインプレッション",
    yen: 5000,
    purpose: "初見でどう見えるかを集める",
    questions: [
      "何の作品／サービスだと思いましたか？",
      "どんな人向けだと思いましたか？",
      "興味を持ちましたか？理由も一言",
      "一番気になったところはどこですか？",
    ],
  },
  {
    id: "brush_up",
    name: "ブラッシュアップ",
    yen: 10000,
    purpose: "改善点を具体的に集める",
    questions: [
      "良かったところは？",
      "違和感があったところは？（理由つき）",
      "分かりにくかったところは？",
      "自分ならどう直しますか？（代案）",
    ],
  },
  {
    id: "boost",
    name: "ブースト",
    yen: 30000,
    purpose: "複数の人から初動反応を集める（初動検証）",
    questions: [
      "初見の第一印象は？",
      "ターゲットは誰に見えましたか？",
      "魅力に感じた点は？",
      "離脱しそう／迷ったポイントは？",
      "一言、改善案があれば",
    ],
  },
];

export const MAX_COURSE_QUESTIONS = 6;

export function courseById(id: SeedCourseId): SeedCourse {
  return SEED_COURSES.find((c) => c.id === id) ?? SEED_COURSES[0];
}

export function courseByYen(yen: number): SeedCourse | undefined {
  return SEED_COURSES.find((c) => c.yen === yen);
}
