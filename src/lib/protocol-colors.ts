/**
 * 4色反応プロトコル。
 * CUD: 色＋短い語＋形（アイコン）。黄の表札のみ ADR-046 確定。
 * 色はいまアース試し（globals.css）。
 */
export type ProtocolColorId = "green" | "blue" | "yellow" | "red";

/** コメント投稿で選ぶ態度（黄＝気になるは含めない） */
export type CommentAttitudeId = Exclude<ProtocolColorId, "yellow">;

/** 役割を表す線画アイコン（仮。語とセットで使う） */
export type ProtocolIconId =
  | "sprout" /** 緑: 跳ねる・芽・横への生長 */
  | "thumbUp" /** 青: 賛成 */
  | "bookmark" /** 黄: 気になる・あとで */
  | "thumbDown"; /** 赤: 反論（gotoHELL役） */

export type ProtocolColorDef = {
  id: ProtocolColorId;
  cssVar: string;
  softVar: string;
  label: string;
  labelStatus: "fixed" | "provisional";
  attitude: string;
  emoji: string;
  icon: ProtocolIconId;
  /** なぜそのアイコンか（lab・議論用） */
  iconWhy: string;
};

export const PROTOCOL_COLORS: ProtocolColorDef[] = [
  {
    id: "green",
    cssVar: "--viscum-protocol-green",
    softVar: "--viscum-protocol-green-soft",
    label: "話変わるけど",
    labelStatus: "provisional",
    attitude: "本題から跳ねる・転用・フラッシュアイデア（By the way）",
    emoji: "🟢",
    icon: "sprout",
    iconWhy: "芽＝横へ伸びる・新しい接続",
  },
  {
    id: "blue",
    cssVar: "--viscum-protocol-blue",
    softVar: "--viscum-protocol-blue-soft",
    label: "賛成",
    labelStatus: "provisional",
    attitude: "通る・良いまとめ／対話では賛成寄り",
    emoji: "🔵",
    icon: "thumbUp",
    iconWhy: "サムズアップ＝賛成。☑／丸チェックより一目で態度が分かる",
  },
  {
    id: "yellow",
    cssVar: "--viscum-protocol-yellow",
    softVar: "--viscum-protocol-yellow-soft",
    label: "気になる",
    labelStatus: "fixed",
    attitude: "あとで戻る／印（ADR-046）。bookmark を黄へ",
    emoji: "🟡",
    icon: "bookmark",
    iconWhy: "保存・あとでの世界語",
  },
  {
    id: "red",
    cssVar: "--viscum-protocol-red",
    softVar: "--viscum-protocol-red-soft",
    label: "反論",
    labelStatus: "provisional",
    attitude: "止まれ・違う・ひっかかる（表の語は反論／中のノリは gotoHELL）",
    emoji: "🔴",
    icon: "thumbDown",
    iconWhy: "サムズダウン＝賛成の対。gotoHELL役。×四角より態度が伝わる",
  },
];

/** コメント必須の3態度（緑・青・赤） */
export const COMMENT_ATTITUDES: ProtocolColorDef[] = PROTOCOL_COLORS.filter(
  (c): c is ProtocolColorDef & { id: CommentAttitudeId } => c.id !== "yellow",
);

export function isCommentAttitudeId(v: unknown): v is CommentAttitudeId {
  return v === "green" || v === "blue" || v === "red";
}

export function countCommentAttitudes(comments: { attitude?: string }[]): Record<
  CommentAttitudeId,
  number
> {
  const out: Record<CommentAttitudeId, number> = {
    green: 0,
    blue: 0,
    red: 0,
  };
  for (const c of comments) {
    if (isCommentAttitudeId(c.attitude)) out[c.attitude] += 1;
  }
  return out;
}
