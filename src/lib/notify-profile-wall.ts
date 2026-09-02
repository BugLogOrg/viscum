import { createNotification } from "@/db/notifications";

function hrefFor(portfolioHandle: string, postId: string): string {
  const h = portfolioHandle.replace(/^@/, "").trim();
  return `/u/${encodeURIComponent(h)}?pw=${encodeURIComponent(postId)}`;
}

/** PF持ち主へ：壁にコメントが付いた */
export async function notifyProfileWallOwner(input: {
  ownerUserId: string;
  portfolioHandle: string;
  postId: string;
  fromHandle: string;
  preview: string;
}): Promise<void> {
  const handle = input.fromHandle.replace(/^@/, "").trim() || "誰か";
  const preview = input.preview.trim().replace(/\s+/g, " ").slice(0, 80);
  await createNotification({
    userId: input.ownerUserId,
    kind: "profile_wall",
    title: "プロフィールにコメントがありました",
    body: preview
      ? `@${handle}: ${preview}${input.preview.trim().length > 80 ? "…" : ""}`
      : `@${handle} があなたのプロフィールにコメントしました。`,
    href: hrefFor(input.portfolioHandle, input.postId),
    audience: "seeder",
    actorHandle: handle,
  });
}

/** 壁コメントの著者へ：自分のコメントに返信が付いた */
export async function notifyProfileWallReply(input: {
  toUserId: string;
  portfolioHandle: string;
  postId: string;
  fromHandle: string;
  preview: string;
}): Promise<void> {
  const handle = input.fromHandle.replace(/^@/, "").trim() || "誰か";
  const preview = input.preview.trim().replace(/\s+/g, " ").slice(0, 80);
  await createNotification({
    userId: input.toUserId,
    kind: "profile_wall",
    title: "あなたのコメントに返信がありました",
    body: preview
      ? `@${handle}: ${preview}${input.preview.trim().length > 80 ? "…" : ""}`
      : `@${handle} があなたのコメントに返信しました。`,
    href: hrefFor(input.portfolioHandle, input.postId),
    audience: "seeder",
    actorHandle: handle,
  });
}
