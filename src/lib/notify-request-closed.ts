import { createNotification } from "@/db/notifications";

/** 依頼主の打ち切り → 受け手へ */
export async function notifyMentorRequestClosed(input: {
  mentorUserId: string;
  requestId: string;
  workId?: string | null;
  workTitle?: string | null;
}): Promise<void> {
  const title = input.workTitle?.trim() || "（タイトル未設定）";
  await createNotification({
    userId: input.mentorUserId,
    kind: "direct_request",
    title: "ご依頼DMが打ち切られました",
    body: `「${title}」— 依頼主がこのお願いを打ち切りました。`,
    href: `/dashboard/messages/${input.requestId}`,
    audience: "mentor",
    workId: input.workId ?? null,
  });
}
