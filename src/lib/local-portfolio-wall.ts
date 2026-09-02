import type { PortfolioWallPost } from "@/data/dummy-portfolio-wall";

const prefix = "viscum_local_pf_wall_v1_";

export function readLocalPortfolioWall(handle: string): PortfolioWallPost[] {
  if (typeof window === "undefined") return [];
  const key = handle.replace(/^@/, "").toLowerCase();
  try {
    const raw = localStorage.getItem(prefix + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PortfolioWallPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalPortfolioWall(
  handle: string,
  posts: PortfolioWallPost[],
) {
  const key = handle.replace(/^@/, "").toLowerCase();
  localStorage.setItem(prefix + key, JSON.stringify(posts.slice(0, 60)));
}

export function addLocalPortfolioWallPost(
  portfolioHandle: string,
  input: { author: string; body: string; parentId?: string },
): PortfolioWallPost {
  const h = portfolioHandle.replace(/^@/, "");
  const author = input.author.replace(/^@/, "").trim();
  const row: PortfolioWallPost = {
    id: `local_wall_${Date.now().toString(36)}`,
    portfolioHandle: h,
    author,
    body: input.body.trim(),
    hoursAgo: 0,
    parentId: input.parentId,
  };
  const next = [row, ...readLocalPortfolioWall(h)];
  writeLocalPortfolioWall(h, next);
  return row;
}

/** Neon 正本に切り替えたあと、端末ゴーストを消す */
export function clearLocalPortfolioWall(handle: string) {
  if (typeof window === "undefined") return;
  const key = handle.replace(/^@/, "").toLowerCase();
  localStorage.removeItem(prefix + key);
}
