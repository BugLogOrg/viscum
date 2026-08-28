import type { Comment } from "@/data/dummy-works";

export async function fetchWorkComments(
  workId: string,
): Promise<{ comments: Comment[]; persisted: boolean }> {
  try {
    const res = await fetch(
      `/api/comments?workId=${encodeURIComponent(workId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return { comments: [], persisted: false };
    const data = (await res.json()) as {
      comments?: Comment[];
      persisted?: boolean;
    };
    return {
      comments: Array.isArray(data.comments) ? data.comments : [],
      persisted: Boolean(data.persisted),
    };
  } catch {
    return { comments: [], persisted: false };
  }
}

export async function postWorkComment(input: {
  workId: string;
  subject: string;
  body: string;
  imageUrls?: string[];
  afterClose?: boolean;
  attitude: "green" | "blue" | "red";
}): Promise<{ ok: boolean; comment?: Comment; error?: string; persisted?: boolean }> {
  try {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      comment?: Comment;
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
      comment: data.comment,
      persisted: Boolean(data.persisted),
    };
  } catch {
    return { ok: false, error: "ネットワークエラー" };
  }
}
