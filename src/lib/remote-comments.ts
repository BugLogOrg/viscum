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
  /** 1段返信の親（ADR-027） */
  parentId?: string;
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

/** シーダー → メンターコメントへ無料お礼 */
export async function postCommentThanks(input: {
  workId: string;
  commentId: string;
  seederHandle: string;
}): Promise<{ ok: boolean; error?: string; persisted?: boolean }> {
  try {
    const res = await fetch("/api/comments/thanks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      persisted?: boolean;
    };
    if (!res.ok) {
      return { ok: false, error: data.error || `お礼に失敗（${res.status}）` };
    }
    return { ok: true, persisted: Boolean(data.persisted) };
  } catch {
    return { ok: false, error: "ネットワークエラー" };
  }
}

/** 投稿者本人のコメント削除（選出・褒賞済みはサーバでも拒否） */
export async function deleteWorkComment(input: {
  workId: string;
  commentId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `/api/comments/${encodeURIComponent(input.commentId)}?workId=${encodeURIComponent(input.workId)}`,
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
