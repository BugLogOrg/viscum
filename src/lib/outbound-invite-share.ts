/** 外向け案内文（コピペ）。着地URLは確定後の本物のみ。 */

import {
  DIRECT_REQUEST_DEADLINE_PRESETS,
  formatRequestAmountLabel,
} from "@/lib/local-request-dms";

/** compose時（closesAt未確定）用 */
export function shareDeadlineLabelFromDays(days: number): string {
  const preset = DIRECT_REQUEST_DEADLINE_PRESETS.find((p) => p.days === days);
  const span = preset?.label ?? `およそ${days}日`;
  return `返信・提出の目安: 発行から${span}（過ぎても即失効しません）`;
}

/** 再コピー時（closesAt確定後）用 */
export function shareDeadlineLabelFromClosesAt(
  iso?: string | null,
): string | null {
  if (!iso) return null;
  const closes = new Date(iso);
  if (!Number.isFinite(closes.getTime())) return null;
  const dateStr = `${closes.getFullYear()}/${closes.getMonth() + 1}/${closes.getDate()}`;
  const passed = closes.getTime() < Date.now();
  return passed
    ? `返信・提出の目安: ${dateStr} 前後（過ぎていますが即失効ではありません）`
    : `返信・提出の目安: ${dateStr} 前後（過ぎても即失効しません）`;
}

export function buildOutboundInviteShareText(input: {
  fromLabel: string;
  workTitle: string;
  workUrl?: string;
  askBullets: string[];
  pitchTrim?: string;
  amountLabel: string;
  /** 希望日の1行（例: 返信・提出の目安: …） */
  deadlineLabel?: string;
  inviteUrl: string;
}): string {
  const askBlockDash = input.askBullets.map((s) => `- ${s}`).join("\n");
  const pitchExtra =
    input.pitchTrim && input.askBullets.length > 0 && !input.askBullets.includes(input.pitchTrim)
      ? `\n（一言）${input.pitchTrim}\n`
      : "";
  const deadlineBlock = input.deadlineLabel
    ? `\n■ 希望日\n${input.deadlineLabel}\n`
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
    deadlineBlock +
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

/**
 * ダッシュボード等から、確定済み招待の案内文を再構成。
 * 未確定なら null（直依頼画面でリンク確定が必要）。
 */
export function buildCachedOutboundShareText(input: {
  workId: string;
  workTitle: string;
  workExternalUrl?: string;
  focusNote?: string;
  fromHandle: string;
  fromLabel: string;
  origin: string;
}): string | null {
  const cached = readCachedOutboundInvite(input.workId, input.fromHandle);
  if (!cached?.invitePath) return null;
  const origin = input.origin.replace(/\/$/, "");
  const askBullets = (input.focusNote ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const bullets =
    askBullets.length > 0
      ? askBullets
      : ["初見の感想を短くいただけると助かります。"];
  const path = cached.invitePath.startsWith("/")
    ? cached.invitePath
    : `/${cached.invitePath}`;
  return buildOutboundInviteShareText({
    fromLabel: input.fromLabel,
    workTitle: input.workTitle,
    workUrl: input.workExternalUrl?.trim() || undefined,
    askBullets: bullets,
    amountLabel: formatRequestAmountLabel(cached.amountYen),
    inviteUrl: `${origin}${path}`,
  });
}
