import { getDummyPortfolioWall } from "@/data/dummy-portfolio-wall";
import { PortfolioCommentsClient } from "@/components/PortfolioCommentsClient";

/** PFコメント欄（ADR-027）。初期一覧はサーバー描画用に渡す */
export function PortfolioWall({ handle }: { handle: string }) {
  const initialPosts = getDummyPortfolioWall(handle);
  return (
    <PortfolioCommentsClient handle={handle} initialPosts={initialPosts} />
  );
}
