import type { PortfolioWallPost } from "@/data/dummy-portfolio-wall";

export async function fetchPortfolioWall(
  handle: string,
): Promise<{ posts: PortfolioWallPost[]; persisted: boolean }> {
  try {
    const res = await fetch(
      `/api/portfolio-wall?handle=${encodeURIComponent(handle.replace(/^@/, ""))}`,
      { cache: "no-store" },
    );
    if (!res.ok) return { posts: [], persisted: false };
    const data = (await res.json()) as {
      posts?: PortfolioWallPost[];
      persisted?: boolean;
    };
    return {
      posts: Array.isArray(data.posts) ? data.posts : [],
      persisted: Boolean(data.persisted),
    };
  } catch {
    return { posts: [], persisted: false };
  }
}

export async function postPortfolioWall(input: {
  handle: string;
  body: string;
  parentId?: string;
}): Promise<{
  ok: boolean;
  post?: PortfolioWallPost;
  error?: string;
  persisted?: boolean;
}> {
  try {
    const res = await fetch("/api/portfolio-wall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      post?: PortfolioWallPost;
      error?: string;
      persisted?: boolean;
    };
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || `保存に失敗（${res.status}）`,
      };
    }
    return {
      ok: true,
      post: data.post,
      persisted: Boolean(data.persisted),
    };
  } catch {
    return { ok: false, error: "ネットワークエラー" };
  }
}

/** 書き込み主本人の削除 */
export async function deletePortfolioWallPost(postId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(
      `/api/portfolio-wall/${encodeURIComponent(postId)}`,
      { method: "DELETE" },
    );
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || `削除に失敗（${res.status}）`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "ネットワークエラー" };
  }
}
