/** 外向け案内文（コピペ）。着地URLは確定後の本物のみ。 */

import {
  DIRECT_REQUEST_DEADLINE_PRESETS,
  formatRequestAmountLabel,
} from "@/lib/local-request-dms";

/** 直依頼招待の閲覧がこの数以上なら転送疑いの注意を出す */
export const INVITE_VIEW_WARN_THRESHOLD = 3;

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
  /** @deprecated 案内文には載せない（ログイン後の着地へ） */
  workUrl?: string;
  /** @deprecated 案内文には載せない */
  askBullets?: string[];
  pitchTrim?: string;
  amountLabel: string;
  /** @deprecated 案内文には載せない（ログイン後） */
  deadlineLabel?: string;
  inviteUrl: string;
}): string {
  void input.workUrl;
  void input.askBullets;
  void input.pitchTrim;
  void input.deadlineLabel;
  return (
    `突然のご連絡失礼いたします。${input.fromLabel}と申します。\n` +
    `Viscum（レビュー依頼のサービス）を通じて、作品のフィードバックをお願いしたくご連絡しました。\n` +
    `\n` +
    `■ 作品（タイトルのみ）\n` +
    `${input.workTitle.trim() || "（タイトル）"}\n` +
    `\n` +
    `■ 褒賞\n` +
    `${input.amountLabel}\n` +
    `\n` +
    `詳細・作品URL・希望日は、下記リンク先でログイン後にご覧いただけます。\n` +
    `※このリンクは特定の方へのご案内です。転送・SNS等での公開はご遠慮ください（直依頼のため）。\n` +
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

export function clearCachedOutboundInvite(workId: string, fromHandle: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(inviteCacheKey(workId, fromHandle));
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
  const path = cached.invitePath.startsWith("/")
    ? cached.invitePath
    : `/${cached.invitePath}`;
  void input.workExternalUrl;
  void input.focusNote;
  return buildOutboundInviteShareText({
    fromLabel: input.fromLabel,
    workTitle: input.workTitle,
    amountLabel: formatRequestAmountLabel(cached.amountYen),
    inviteUrl: `${origin}${path}`,
  });
}
