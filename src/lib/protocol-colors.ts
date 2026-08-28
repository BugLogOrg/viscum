/**
 * 4色反応プロトコル。
 * CUD: 色＋短い語＋形（アイコン）。黄の表札のみ ADR-046 確定。
 * 色はいまアース試し（globals.css）。
 */
export type ProtocolColorId = "green" | "blue" | "yellow" | "red";

/** 役割を表す線画アイコン（仮。語とセットで使う） */
export type ProtocolIconId =
  | "spark" /** 緑: 跳ねる・フラッシュ */
  | "check" /** 青: 通る・賛成 */
  | "bookmark" /** 黄: 気になる・あとで */
  | "cross"; /** 赤: 反論・違う */

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
    icon: "spark",
    iconWhy: "閃き・横へのジャンプ。電球は「正解」に寄りやすいので火花",
  },
  {
    id: "blue",
    cssVar: "--viscum-protocol-blue",
    softVar: "--viscum-protocol-blue-soft",
    label: "賛成",
    labelStatus: "provisional",
    attitude: "通る・良いまとめ／対話では賛成寄り",
    emoji: "🔵",
    icon: "check",
    iconWhy: "☑＝塗り四角＋チェック。線だけ丸は薄い。👍より混線しにくい",
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
    iconWhy: "保存・あとでの世界語。目玉より「印」に近い",
  },
  {
    id: "red",
    cssVar: "--viscum-protocol-red",
    softVar: "--viscum-protocol-red-soft",
    label: "反論",
    labelStatus: "provisional",
    attitude: "止まれ・違う・ひっかかる",
    emoji: "🔴",
    icon: "cross",
    iconWhy: "違う・止まれ。チェックと対の塗り四角＋×。⚠は黄と被りやすい",
  },
];
