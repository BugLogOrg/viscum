/** 作品詳細に足したコメント（端末内・デモ永続） */
import type { Comment } from "@/data/dummy-works";

const prefix = "viscum_local_comments_v1_";

export function readLocalComments(workId: string): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(prefix + workId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Comment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalComments(workId: string, comments: Comment[]) {
  localStorage.setItem(
    prefix + workId,
    JSON.stringify(comments.slice(0, 40)),
  );
}

export function addLocalComment(
  workId: string,
  input: { author: string; subject: string; body: string; afterClose?: boolean },
): Comment {
  const row: Comment & { afterClose?: boolean } = {
    id: `local_c_${Date.now().toString(36)}`,
    author: input.author,
    subject: input.subject.trim(),
    body: input.body.trim(),
    hoursAgo: 0,
    afterClose: input.afterClose,
  };
  const next = [row, ...readLocalComments(workId)];
  writeLocalComments(workId, next);
  return row;
}
