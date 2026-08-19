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

export function installDemoRequestDms(viewerHandle: string) {
  const existing = readRequestDms();
  if (existing.some((r) => r.id.startsWith("req_demo_"))) return;

  const now = Date.now();
  const demos: RequestDm[] = [
    {
      id: "req_demo_01",
      workId: "promo-15s",
      workTitle: "宅配ボックスIoTの15秒プロモ",
      fromHandle: "ken",
      fromAccountName: "ken",
      toHandle: viewerHandle,
      amountYen: 3000,
      pitch: "あなただけに見てほしいです。見る範囲は説明どおりで大丈夫です。",
      status: "pending",
      createdAt: new Date(now - 45 * 60000).toISOString(),
      messages: [
        {
          id: "req_demo_01_m0",
          fromHandle: "ken",
          body: "あなただけに見てほしいです。見る範囲は説明どおりで大丈夫です。",
          createdAt: new Date(now - 45 * 60000).toISOString(),
        },
      ],
    },
    {
      id: "req_demo_02",
      workId: "note-clip",
      workTitle: "noteクリップの導線レビュー",
      fromHandle: viewerHandle,
      fromAccountName: viewerHandle,
      toHandle: "ayu",
      amountYen: 1500,
      pitch: "冒頭3秒だけ見てほしいです。",
      status: "accepted",
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      messages: [
        {
          id: "req_demo_02_m0",
          fromHandle: viewerHandle,
          body: "冒頭3秒だけ見てほしいです。",
          createdAt: new Date(now - 2 * 86400000).toISOString(),
        },
        {
          id: "req_demo_02_m1",
          fromHandle: "ayu",
          body: "やるね。今夜見て返す。",
          createdAt: new Date(now - 2 * 86400000 + 3600000).toISOString(),
        },
      ],
    },
  ];
  writeRequestDms([...demos, ...existing]);
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function statusLabel(status: RequestDmStatus): string {
  if (status === "accepted") return "やる";
  if (status === "declined") return "いまは無理";
  return "未返信";
}
