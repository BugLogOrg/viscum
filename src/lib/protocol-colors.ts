/**
 * 4色反応プロトコル（ビビッド層）。
 * トンマナ（アース）とは別レイヤ。意味は色＋短い語で伝える（CUD）。
 * 黄の表札のみ ADR-046 確定。他は仮置き。
 */
export type ProtocolColorId = "green" | "blue" | "yellow" | "red";

export type ProtocolColorDef = {
  id: ProtocolColorId;
  /** CSS 変数名（--viscum-protocol-*） */
  cssVar: string;
  softVar: string;
  /** UI に出す短い語 */
  label: string;
  /** 確定か仮か */
  labelStatus: "fixed" | "provisional";
  /** 態度の核（ツールチップ・説明用） */
  attitude: string;
  emoji: string;
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
  },
  {
    id: "blue",
    cssVar: "--viscum-protocol-blue",
    softVar: "--viscum-protocol-blue-soft",
    label: "賛成",
    labelStatus: "provisional",
    attitude: "通る・良いまとめ／対話では賛成寄り",
    emoji: "🔵",
  },
  {
    id: "yellow",
    cssVar: "--viscum-protocol-yellow",
    softVar: "--viscum-protocol-yellow-soft",
    label: "気になる",
    labelStatus: "fixed",
    attitude: "あとで戻る／印（ADR-046）。bookmark とマップ。形は目玉アイコン",
    emoji: "🟡",
  },
  {
    id: "red",
    cssVar: "--viscum-protocol-red",
    softVar: "--viscum-protocol-red-soft",
    label: "反論",
    labelStatus: "provisional",
    attitude: "止まれ・違う・ひっかかる",
    emoji: "🔴",
  },
];
