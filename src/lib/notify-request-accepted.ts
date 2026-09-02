import { createNotification } from "@/db/notifications";

/** 「やる」→ 依頼主へ */
export async function notifySeederRequestAccepted(input: {
  seederUserId: string;
  requestId: string;
  workId?: string | null;
  workTitle?: string | null;
}): Promise<void> {
  const title = input.workTitle?.trim() || "（タイトル未設定）";
  await createNotification({
    userId: input.seederUserId,
    kind: "direct_request",
    title: "ご依頼DMに返事が届きました",
    body: `「${title}」— やる、と返されました。`,
    href: `/dashboard/messages/${input.requestId}`,
    audience: "seeder",
    workId: input.workId ?? null,
  });
}
