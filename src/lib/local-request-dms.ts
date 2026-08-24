/** 直依頼単位の薄いDM（端末内デモ。全開受信箱ではない・ADR-028） */

export type RequestDmStatus = "pending" | "accepted" | "declined";

export type RequestDmMessage = {
  id: string;
  /** 英語ID */
  fromHandle: string;
  body: string;
  createdAt: string;
};

export type RequestDm = {
  id: string;
  workId: string;
  workTitle: string;
  /** 作品の外部URL（あれば） */
  workExternalUrl?: string;
  /** 依頼作成時のサムネ（受け手でも見えるスナップショット） */
  workThumbUrl?: string;
  /** 依頼作成時の作品要約 */
  workSummary?: string;
  /** 依頼する側 */
  fromHandle: string;
  fromAccountName?: string;
  /** 依頼される側。外リンク未割当は空文字 */
  toHandle: string;
  /** 外リンク招待ID（あれば） */
  inviteId?: string;
  /** まだ相手アカウント未確定 */
  outboundUnassigned?: boolean;
  amountYen: number;
  pitch: string;
  status: RequestDmStatus;
  createdAt: string;
  /** 最終更新（返事・ステータス変更）。一覧の並び正本 */
  updatedAt?: string;
  messages: RequestDmMessage[];
};

const KEY = "viscum_local_request_dms_v1";

export function readRequestDms(): RequestDm[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RequestDm[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Neon移行後の残骸掃除（デモ・端末のみの旧依頼） */
export function clearLocalRequestDms() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function isLegacyLocalRequestId(id: string) {
  return id.startsWith("req_") || id.startsWith("req_demo_");
}

function writeRequestDms(rows: RequestDm[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 40)));
}

export function getRequestDm(id: string): RequestDm | null {
  return readRequestDms().find((r) => r.id === id) ?? null;
}

export function upsertRequestDm(row: RequestDm) {
  const rest = readRequestDms().filter((r) => r.id !== row.id);
  writeRequestDms([row, ...rest]);
}

export function createRequestDm(input: {
  workId: string;
  workTitle: string;
  workExternalUrl?: string;
  workThumbUrl?: string;
  workSummary?: string;
  fromHandle: string;
  fromAccountName?: string;
  toHandle: string;
  amountYen: number;
  pitch: string;
}): RequestDm {
  const id = `req_${Date.now().toString(36)}`;
  const createdAt = new Date().toISOString();
  const row: RequestDm = {
    id,
    workId: input.workId,
    workTitle: input.workTitle,
    workExternalUrl: input.workExternalUrl?.trim() || undefined,
    workThumbUrl: input.workThumbUrl?.trim() || undefined,
    workSummary: input.workSummary?.trim() || undefined,
    fromHandle: input.fromHandle,
    fromAccountName: input.fromAccountName,
    toHandle: input.toHandle,
    amountYen: input.amountYen,
    pitch: input.pitch,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
    messages: [
      {
        id: `${id}_m0`,
        fromHandle: input.fromHandle,
        body: input.pitch,
        createdAt,
      },
    ],
  };
  upsertRequestDm(row);
  return row;
}

export function setRequestDmStatus(id: string, status: RequestDmStatus) {
  const row = getRequestDm(id);
  if (!row) return null;
  const next = { ...row, status, updatedAt: new Date().toISOString() };
  upsertRequestDm(next);
  return next;
}

export function appendRequestDmMessage(
  id: string,
  fromHandle: string,
  body: string,
): RequestDm | null {
  const row = getRequestDm(id);
  if (!row) return null;
  const text = body.trim();
  if (!text) return row;
  const msg: RequestDmMessage = {
    id: `${id}_m${Date.now().toString(36)}`,
    fromHandle,
    body: text.slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  const next = {
    ...row,
    messages: [...row.messages, msg],
    updatedAt: msg.createdAt,
  };
  upsertRequestDm(next);
  return next;
}

export function pendingRequestCount(forHandle?: string): number {
  return readRequestDms().filter((r) => {
    if (r.status !== "pending") return false;
    if (!forHandle) return true;
    return r.toHandle === forHandle || r.fromHandle === forHandle;
  }).length;
}

/** @deprecated Neon移行後は呼ばない。誤って呼ばれても残骸を消すだけ */
export function installDemoRequestDms(_viewerHandle: string) {
  clearLocalRequestDms();
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function statusLabel(status: RequestDmStatus): string {
  if (status === "accepted") return "やる";
  if (status === "declined") return "いまは無理";
  return "未返信";
}

/** ご依頼DM一覧・スレ用の日時（例: 2026/08/24 20:10） */
export function formatRequestDmStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

/** 直依頼金額プリセット（ADR-034）。0＝近い相手向け無料 */
export const DIRECT_REQUEST_AMOUNT_PRESETS = [
  0, 5000, 10_000, 30_000, 50_000,
] as const;

/** 0 または ¥5,000〜¥100,000。未満は 5k に繰り上げ */
export function coerceDirectRequestAmountYen(
  raw: unknown,
  fallback = 5000,
): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return fallback;
  const n = Math.round(raw);
  if (n <= 0) return 0;
  if (n < 5000) return 5000;
  return Math.min(n, 100_000);
}

export function formatRequestAmountLabel(yen: number): string {
  if (yen <= 0) return "金額なし（無料）";
  return formatYen(yen);
}
