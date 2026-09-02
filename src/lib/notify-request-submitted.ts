import { createNotification } from "@/db/notifications";

/** メンター提出 → 依頼主へ。ベル通知（スレへのシステムメモとは別系統）。 */
export async function notifySeederRequestSubmitted(input: {
  seederUserId: string;
  requestId: string;
  workId?: string | null;
  workTitle?: string | null;
}): Promise<void> {
  const title = input.workTitle?.trim() || "（タイトル未設定）";
  await createNotification({
    userId: input.seederUserId,
    kind: "direct_request",
    title: "ご依頼DMに提出が届きました",
    body: `「${title}」— 提出済みです。内容を確認して完了承認・お支払いへ進めてください。`,
    href: `/dashboard/messages/${input.requestId}`,
    audience: "seeder",
    workId: input.workId ?? null,
  });
}
