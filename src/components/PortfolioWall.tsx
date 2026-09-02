import { getDummyPortfolioWall } from "@/data/dummy-portfolio-wall";
import { PortfolioCommentsClient } from "@/components/PortfolioCommentsClient";
import { listNeonPortfolioWall } from "@/lib/neon-portfolio-wall";

/** PFコメント欄（ADR-027）。Neon をサーバで先読みして空フラッシュを防ぐ */
export async function PortfolioWall({ handle }: { handle: string }) {
  const neon = await listNeonPortfolioWall(handle);
  const dummy = getDummyPortfolioWall(handle);
  const initialPosts = neon.persisted
    ? neon.posts
    : [...neon.posts, ...dummy];

  return (
    <PortfolioCommentsClient
      handle={handle}
      initialPosts={initialPosts}
      initialPersisted={neon.persisted}
    />
  );
}
