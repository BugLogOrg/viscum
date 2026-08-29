/** ADR-031/033: 4コースフラット（無料／初見／改善／公開ブースト） */

export type SeedCourseId = "first_impression" | "brush_up";

export type SeedPlanId = "free_comment" | SeedCourseId | "public_boost";

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
    name: "初見レビュー",
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
    name: "改善提案",
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
  purpose: "ストアやSNSなど、自分の公開場所へ正直な反応・投稿を募り、初動を押し上げる",
  criteria: [
    "指定した公開場所（ストア／拡張／SNS等）へ正直な反応・投稿を残す",
    "実利用したうえで書く（触っていない評価は除外の目安）",
    "指定された観点に触れる",
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
