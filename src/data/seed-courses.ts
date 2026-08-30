/** ADR-031/033: 4コースフラット（無料／初見／改善／公開ブースト）
 * ADR-059: シードUIは「何が知りたい？」を主、商品名は副
 */

export type SeedCourseId = "first_impression" | "brush_up";

export type SeedPlanId = "free_comment" | SeedCourseId | "public_boost";

export type SeedCourse = {
  id: SeedCourseId;
  name: string;
  yen: 5000 | 10000;
  /** シーダー向け：欲しい結果（UIの主行） */
  want: string;
  purpose: string;
  questions: string[];
};

export const FREE_COMMENT = {
  name: "無料コメント",
  yen: 0 as const,
  want: "とりあえず感想が欲しい",
  purpose: "コメント歓迎。お金は使いません",
} as const;

export const SEED_COURSES: SeedCourse[] = [
  {
    id: "first_impression",
    name: "初見レビュー",
    yen: 5000,
    want: "初めて見た人の反応が知りたい",
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
    name: "改善提案",
    yen: 10000,
    want: "もっと良くする方法が欲しい",
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

/** 公開ブースト「募集の目安」の最大行数 */
export const MAX_BOOST_CRITERIA = 10;

export function courseById(id: SeedCourseId): SeedCourse {
  return SEED_COURSES.find((c) => c.id === id) ?? SEED_COURSES[0];
}

export function isFieldCourse(id: SeedPlanId): id is SeedCourseId {
  return id === "first_impression" || id === "brush_up";
}

/**
 * 公開ブースト（プランD）— ¥30,000一択。
 * 記入後報告→シーダーが選ぶ（全員払いしない）。
 */
export const PUBLIC_BOOST = {
  name: "公開ブースト",
  yen: 30000 as const,
  want: "とにかく人に見てもらいたい",
  /** シードカードの補足（広めたい＝閲覧増ではない、の肝） */
  seedHint: "メンターが外に書いて報告 → あなたが選んで褒賞",
  purpose: "ストアやSNSなど、自分の公開場所へ正直な反応・投稿を募り、初動を押し上げる",
  criteria: [
    "上記の「書いてほしい場所」へ正直な反応・投稿を残す",
    "実利用したうえで書く（触っていない評価は除外の目安）",
    "見てほしい観点：",
    "やらせ・星の売買保証は不可。必要な開示があれば付ける",
    "記入後に投稿URL等を報告する。褒賞は全員払いではなく、選ばれた人へ",
  ],
} as const;

/**
 * 作品詳細・コメントUI向け（メンターが読む表札）。
 * 投稿フォーム（シーダー）は PostForm 側の「聞くこと／募集の目安」を使う。
 */
export function scaffoldForPlan(plan: SeedPlanId): {
  label: string;
  lines: string[];
} | null {
  if (plan === "first_impression" || plan === "brush_up") {
    return {
      label: "聞かれていること",
      lines: [...courseById(plan).questions],
    };
  }
  if (plan === "public_boost") {
    return {
      label: "参加の目安",
      lines: [...PUBLIC_BOOST.criteria],
    };
  }
  return null;
}
