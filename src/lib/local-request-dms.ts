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
  /** 依頼される側 */
  toHandle: string;
  amountYen: number;
  pitch: string;
  status: RequestDmStatus;
  createdAt: string;
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
  const next = { ...row, status };
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
  const next = { ...row, messages: [...row.messages, msg] };
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
