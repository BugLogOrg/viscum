import { createNotification } from "@/db/notifications";

/** 辞退はご依頼DMへの返事。汎用イベントではなくスレ通知のトーンで出す。 */
export async function notifySeederRequestDeclined(input: {
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
    body: `「${title}」— いまは無理、と返されました。`,
    href: `/dashboard/messages/${input.requestId}`,
    audience: "seeder",
    workId: input.workId ?? null,
  });
}
