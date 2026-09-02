import { createNotification } from "@/db/notifications";

/** スレ本文メッセージ → 相手側へ。短く本文を載せる。 */
export async function notifyRequestPartyMessage(input: {
  toUserId: string;
  requestId: string;
  workId?: string | null;
  workTitle?: string | null;
  fromHandle: string;
  body: string;
  /** 受け手が seeder か mentor か（表示用） */
  audience: "seeder" | "mentor";
}): Promise<void> {
  const title = input.workTitle?.trim() || "（タイトル未設定）";
  const handle = input.fromHandle.replace(/^@/, "").trim() || "相手";
  const preview = input.body.trim().replace(/\s+/g, " ").slice(0, 80);
  await createNotification({
    userId: input.toUserId,
    kind: "direct_request",
    title: "ご依頼DMにメッセージが届きました",
    body: `「${title}」— @${handle}: ${preview}${input.body.trim().length > 80 ? "…" : ""}`,
    href: `/dashboard/messages/${input.requestId}`,
    audience: input.audience,
    actorHandle: handle,
    workId: input.workId ?? null,
  });
}
