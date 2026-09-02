import { createNotificationsForUsers } from "@/db/notifications";

function workCommentHref(workId: string, commentId: string): string {
  return `/w/${encodeURIComponent(workId)}?c=${encodeURIComponent(commentId)}`;
}

function shortTitle(title: string): string {
  const t = title.trim();
  if (!t) return "";
  return t.length > 36 ? `${t.slice(0, 36)}…` : t;
}

/** 自分のコメントへの返信 → 親著者（シーダー向け prefs） */
export async function notifyCommentReply(input: {
  toUserId: string;
  workId: string;
  commentId: string;
  workTitle?: string | null;
  fromHandle: string;
}): Promise<void> {
  const handle = input.fromHandle.replace(/^@/, "").trim() || "誰か";
  const title = shortTitle(input.workTitle ?? "");
  await createNotificationsForUsers([input.toUserId], {
    kind: "comment",
    title: "あなたのコメントに返信がありました",
    body: title
      ? `@${handle} が「${title}」のコメントに返信しました。`
      : `@${handle} があなたのコメントに返信しました。`,
    href: workCommentHref(input.workId, input.commentId),
    audience: "seeder",
    actorHandle: handle,
    workId: input.workId,
  });
}

/** 自分のシード／コンペへの新規コメント（ルート）→ シーダー */
export async function notifySeedNewComment(input: {
  seederId: string;
  workId: string;
  commentId: string;
  workTitle?: string | null;
  fromHandle: string;
}): Promise<void> {
  const handle = input.fromHandle.replace(/^@/, "").trim() || "誰か";
  const title = shortTitle(input.workTitle ?? "");
  await createNotificationsForUsers([input.seederId], {
    kind: "comment",
    title: "あなたのシードにコメントがありました",
    body: title
      ? `@${handle} が「${title}」にコメントしました。`
      : `@${handle} があなたのシードにコメントしました。`,
    href: workCommentHref(input.workId, input.commentId),
    audience: "seeder",
    actorHandle: handle,
    workId: input.workId,
  });
}

/** 自分のシード上の返信（親が自分以外）→ シーダーにも活動を知らせる */
export async function notifySeedReplyActivity(input: {
  seederId: string;
  workId: string;
  commentId: string;
  workTitle?: string | null;
  fromHandle: string;
}): Promise<void> {
  const handle = input.fromHandle.replace(/^@/, "").trim() || "誰か";
  const title = shortTitle(input.workTitle ?? "");
  await createNotificationsForUsers([input.seederId], {
    kind: "comment",
    title: "あなたのシードに返信がありました",
    body: title
      ? `@${handle} が「${title}」のスレに返信しました。`
      : `@${handle} があなたのシードのスレに返信しました。`,
    href: workCommentHref(input.workId, input.commentId),
    audience: "seeder",
    actorHandle: handle,
    workId: input.workId,
  });
}
