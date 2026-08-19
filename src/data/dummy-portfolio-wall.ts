/** PF壁の取引メモ／一見さんメモ（ADR-027）。デモ用ダミー */

export type PortfolioWallKind = "trade" | "guest";

export type PortfolioTradeLabel =
  | "お礼"
  | "申立"
  | "決着"
  | "やりとり";

export type PortfolioWallPost = {
  id: string;
  /** このPFの持ち主 handle（@なし） */
  portfolioHandle: string;
  kind: PortfolioWallKind;
  /** 取引メモのときだけ */
  tradeLabel?: PortfolioTradeLabel;
  author: string;
  body: string;
  hoursAgo: number;
  /** 案件へのリンク（取引メモ） */
  workId?: string;
  workTitle?: string;
};

const DUMMY_WALL: PortfolioWallPost[] = [
  {
    id: "wall-ken-1",
    portfolioHandle: "ken",
    kind: "trade",
    tradeLabel: "お礼",
    author: "ayu",
    body: "採用〜支払いまでスムーズでした。締切後の追記コメントにも反応もらえて助かりました。また書けます。",
    hoursAgo: 18,
    workId: "closed-one",
    workTitle: "終了・支払い完了のアーカイブ見本",
  },
  {
    id: "wall-ken-2",
    portfolioHandle: "ken",
    kind: "trade",
    tradeLabel: "やりとり",
    author: "sana",
    body: "合格あと支払い待ち、とのこと了解です。今週中にCheckoutでお願いします。こちらは提出ログ残してます。",
    hoursAgo: 40,
    workId: "pay-after-adopt",
    workTitle: "採用直後・支払い前の見本",
  },
  {
    id: "wall-ken-3",
    portfolioHandle: "ken",
    kind: "guest",
    author: "moss",
    body: "フィードでよく見かけるシーダー。支払い実績が見えるの、直依頼する側としては安心材料になってると思います。",
    hoursAgo: 72,
  },
  {
    id: "wall-mdb-1",
    portfolioHandle: "mdb",
    kind: "trade",
    tradeLabel: "お礼",
    author: "neo",
    body: "チップ着金まで見えました。スコアじゃなく件数の事実だけで十分信頼できます。",
    hoursAgo: 5,
    workId: "closed-one",
    workTitle: "終了・支払い完了のアーカイブ見本",
  },
  {
    id: "wall-mdb-2",
    portfolioHandle: "mdb",
    kind: "guest",
    author: "wave",
    body: "LPの「ちゃんと払う人？」の節、このPFとつながってて分かりやすいです。",
    hoursAgo: 30,
  },
  {
    id: "wall-ayu-1",
    portfolioHandle: "ayu",
    kind: "trade",
    tradeLabel: "決着",
    author: "ken",
    body: "申立の件、追加で払いました。ログ残してくれて助かりました。次回は期限前に払います。",
    hoursAgo: 96,
    workId: "pay-after-adopt",
    workTitle: "採用直後・支払い前の見本",
  },
];

export function getDummyPortfolioWall(handle: string): PortfolioWallPost[] {
  const key = handle.replace(/^@/, "").toLowerCase();
  return DUMMY_WALL.filter(
    (p) => p.portfolioHandle.toLowerCase() === key,
  ).sort((a, b) => a.hoursAgo - b.hoursAgo);
}
