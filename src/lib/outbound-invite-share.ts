/** 外向け案内文（コピペ）。着地URLは確定後の本物のみ。 */

export function buildOutboundInviteShareText(input: {
  fromLabel: string;
  workTitle: string;
  workUrl?: string;
  askBullets: string[];
  pitchTrim?: string;
  amountLabel: string;
  inviteUrl: string;
}): string {
  const askBlockDash = input.askBullets.map((s) => `- ${s}`).join("\n");
  const pitchExtra =
    input.pitchTrim && input.askBullets.length > 0 && !input.askBullets.includes(input.pitchTrim)
      ? `\n（一言）${input.pitchTrim}\n`
      : "";
  return (
    `突然のご連絡失礼いたします。${input.fromLabel}と申します。\n` +
    `Viscum（レビュー依頼のサービス）を通じて、作品のフィードバックをお願いしたくご連絡しました。\n` +
    `\n` +
    `■ 作品\n` +
    `${input.workTitle.trim() || "（タイトル）"}\n` +
    (input.workUrl ? `${input.workUrl}\n` : "") +
    `\n` +
    `■ お願いしたいこと\n` +
    `${askBlockDash}\n` +
    pitchExtra +
    `\n` +
    `■ 謝礼\n` +
    `${input.amountLabel}\n` +
    `\n` +
    `詳細・概要は下記リンク先でご確認いただけます（リンクを知っている方向けです）。\n` +
    `ご返信・お受け取りにはViscumへのログイン（無料）が必要です。\n` +
    `ご都合が合わなければ、無視していただいて構いません。\n` +
    `\n` +
    `${input.inviteUrl}`
  ).trim();
}

export type CachedOutboundInvite = {
  invitePath: string;
  requestPath?: string;
  amountYen: number;
  workId: string;
  updatedAt: string;
};

function inviteCacheKey(workId: string, fromHandle: string) {
  return `viscum_outbound_invite_v1:${workId}:${fromHandle.toLowerCase() || "anon"}`;
}

export function readCachedOutboundInvite(
  workId: string,
  fromHandle: string,
): CachedOutboundInvite | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(inviteCacheKey(workId, fromHandle));
    if (!raw) return null;
    const d = JSON.parse(raw) as CachedOutboundInvite;
    if (!d?.invitePath || d.workId !== workId) return null;
    return d;
  } catch {
    return null;
  }
}

export function writeCachedOutboundInvite(
  fromHandle: string,
  data: CachedOutboundInvite,
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      inviteCacheKey(data.workId, fromHandle),
      JSON.stringify(data),
    );
  } catch {
    /* ignore */
  }
}
