/** 作品詳細に足したコメント（端末内・デモ永続） */
import type { Comment } from "@/data/dummy-works";
import type { CommentAttitudeId } from "@/lib/protocol-colors";

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

/** 端末内に残っている全作品のローカルコメント */
export function listAllLocalCommentBuckets(): {
  workId: string;
  comments: Comment[];
}[] {
  if (typeof window === "undefined") return [];
  const out: { workId: string; comments: Comment[] }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const workId = key.slice(prefix.length);
      if (!workId) continue;
      out.push({ workId, comments: readLocalComments(workId) });
    }
  } catch {
    return out;
  }
  return out;
}

export function addLocalComment(
  workId: string,
  input: {
    author: string;
    accountName?: string;
    subject: string;
    body: string;
    afterClose?: boolean;
    imageUrls?: string[];
    attitude: CommentAttitudeId;
    parentId?: string;
  },
): Comment {
  const row: Comment = {
    id: `local_c_${Date.now().toString(36)}`,
    author: input.author,
    accountName: input.accountName,
    subject: input.subject.trim(),
    body: input.body.trim(),
    hoursAgo: 0,
    afterClose: input.afterClose,
    imageUrls: input.imageUrls?.length ? input.imageUrls : undefined,
    attitude: input.attitude,
    parentId: input.parentId,
  };
  const next = [row, ...readLocalComments(workId)];
  writeLocalComments(workId, next);
  return row;
}

/** 本人端末のローカルコメント削除（選出・褒賞済みは不可） */
export function removeLocalComment(
  workId: string,
  commentId: string,
): { ok: true } | { ok: false; error: string } {
  const list = readLocalComments(workId);
  const target = list.find((c) => c.id === commentId);
  if (!target) {
    return { ok: false, error: "コメントが見つかりません" };
  }
  if (target.adopted) {
    return { ok: false, error: "選出済みのコメントは削除できません" };
  }
  if (target.tipped) {
    return { ok: false, error: "褒賞支払い済みのコメントは削除できません" };
  }
  writeLocalComments(
    workId,
    list.filter((c) => c.id !== commentId),
  );
  return { ok: true };
}
