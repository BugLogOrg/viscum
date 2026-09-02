import { createNotification } from "@/db/notifications";

/** 依頼主の支払完了 → 受け手（メンター）へベル通知。 */
export async function notifyMentorRequestPaid(input: {
  mentorUserId: string;
  requestId: string;
  workId?: string | null;
  workTitle?: string | null;
  amountYen?: number | null;
}): Promise<void> {
  const title = input.workTitle?.trim() || "（タイトル未設定）";
  const yen =
    typeof input.amountYen === "number" && Number.isFinite(input.amountYen)
      ? Math.max(0, Math.round(input.amountYen))
      : null;
  const amountPart =
    yen != null && yen > 0 ? `（褒賞 ¥${yen.toLocaleString("ja-JP")}）` : "";
  await createNotification({
    userId: input.mentorUserId,
    kind: "direct_request",
    title: "ご依頼DMの支払いが完了しました",
    body: `「${title}」— 完了・支払済になりました${amountPart}。`,
    href: `/dashboard/messages/${input.requestId}`,
    audience: "mentor",
    workId: input.workId ?? null,
  });
}
