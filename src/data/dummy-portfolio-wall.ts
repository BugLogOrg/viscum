/** PFコメント（ADR-027）。コテハン・ログイン必須。1段返信可 */

export type PortfolioWallPost = {
  id: string;
  /** このPFの持ち主 handle（@なし） */
  portfolioHandle: string;
  /** 投稿者コテハン（@なし） */
  author: string;
  body: string;
  hoursAgo: number;
  /** 返信先コメントID（1段のみ。深いネストはしない） */
  parentId?: string;
};

const DUMMY_WALL: PortfolioWallPost[] = [
  {
    id: "wall-ken-1",
    portfolioHandle: "ken",
    author: "ayu",
    body: "選出〜褒賞の支払いまでスムーズでした。締切後の追記コメントにも反応もらえて助かりました。また書けます。",
    hoursAgo: 18,
  },
  {
    id: "wall-ken-2",
    portfolioHandle: "ken",
    author: "sana",
    body: "合格あと支払い待ち、とのこと了解です。今週中にCheckoutでお願いします。",
    hoursAgo: 40,
  },
  {
    id: "wall-ken-2r",
    portfolioHandle: "ken",
    author: "ken",
    parentId: "wall-ken-2",
    body: "@sana 了解です。今日中に払います。",
    hoursAgo: 36,
  },
  {
    id: "wall-ken-3",
    portfolioHandle: "ken",
    author: "moss",
    body: "フィードでよく見かけるシーダー。支払い実績が見えるの、直依頼する側としては安心材料になってると思います。",
    hoursAgo: 72,
  },
  {
    id: "wall-tori-1",
    portfolioHandle: "tori",
    author: "neo",
    body: "褒賞の着金まで見えました。スコアじゃなく件数の事実だけで十分信頼できます。",
    hoursAgo: 5,
  },
  {
    id: "wall-tori-2",
    portfolioHandle: "tori",
    author: "wave",
    body: "LPの「ちゃんと払う人？」の節、このPFとつながってて分かりやすいです。",
    hoursAgo: 30,
  },
  {
    id: "wall-ayu-1",
    portfolioHandle: "ayu",
    author: "ken",
    body: "申立の件、追加で払いました。ログ残してくれて助かりました。次回は期限前に払います。",
    hoursAgo: 96,
  },
];

export function getDummyPortfolioWall(handle: string): PortfolioWallPost[] {
  const key = handle.replace(/^@/, "").toLowerCase();
  return DUMMY_WALL.filter(
    (p) => p.portfolioHandle.toLowerCase() === key,
  ).sort((a, b) => a.hoursAgo - b.hoursAgo);
}
