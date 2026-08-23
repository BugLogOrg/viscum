import type { RequestDm, RequestDmStatus } from "@/lib/local-request-dms";

type MyRequestsResult = {
  requests: RequestDm[];
  persisted: boolean;
};

const EMPTY: MyRequestsResult = { requests: [], persisted: false };
let myRequestsCache: { at: number; data: MyRequestsResult } | null = null;
let myRequestsInflight: Promise<MyRequestsResult> | null = null;
const MY_REQUESTS_TTL_MS = 20_000;

export function invalidateMyRequestsCache() {
  myRequestsCache = null;
}

/** ヘッダー未読などと一覧で二重取得しないよう短時間キャッシュ＋inflight共有 */
export async function fetchMyRequests(opts?: {
  force?: boolean;
}): Promise<MyRequestsResult> {
  const now = Date.now();
  if (
    !opts?.force &&
    myRequestsCache &&
    now - myRequestsCache.at < MY_REQUESTS_TTL_MS
  ) {
    return myRequestsCache.data;
  }
  if (!opts?.force && myRequestsInflight) {
    return myRequestsInflight;
  }

  myRequestsInflight = (async () => {
    try {
      const res = await fetch("/api/requests", { cache: "no-store" });
      if (!res.ok) {
        myRequestsCache = { at: Date.now(), data: EMPTY };
        return EMPTY;
      }
      const data = (await res.json()) as {
        requests?: RequestDm[];
        persisted?: boolean;
      };
      const result: MyRequestsResult = {
        requests: Array.isArray(data.requests) ? data.requests : [],
        persisted: Boolean(data.persisted),
      };
      myRequestsCache = { at: Date.now(), data: result };
      return result;
    } catch {
      myRequestsCache = { at: Date.now(), data: EMPTY };
      return EMPTY;
    } finally {
      myRequestsInflight = null;
    }
  })();

  return myRequestsInflight;
}

export async function fetchRequestDm(
  id: string,
): Promise<{ request?: RequestDm; persisted: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/requests/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      request?: RequestDm;
      error?: string;
      persisted?: boolean;
    };
    if (!res.ok) {
      return { persisted: false, error: data.error || `取得失敗（${res.status}）` };
    }
    return { request: data.request, persisted: Boolean(data.persisted) };
  } catch {
    return { persisted: false, error: "ネットワークエラー" };
  }
}

export async function postRequestDm(input: {
  workId: string;
  workTitle: string;
  workExternalUrl?: string;
  workThumbUrl?: string;
  workSummary?: string;
  toHandle: string;
  amountYen: number;
  pitch: string;
}): Promise<{ ok: boolean; request?: RequestDm; error?: string }> {
  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      request?: RequestDm;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.error || `送信失敗（${res.status}）` };
    }
    invalidateMyRequestsCache();
    return { ok: true, request: data.request };
  } catch {
    return { ok: false, error: "ネットワークエラー" };
  }
}

export async function patchRequestDm(
  id: string,
  body: { status?: RequestDmStatus; message?: string },
): Promise<{ ok: boolean; request?: RequestDm; error?: string }> {
  try {
    const res = await fetch(`/api/requests/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      request?: RequestDm;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.error || `更新失敗（${res.status}）` };
    }
    invalidateMyRequestsCache();
    return { ok: true, request: data.request };
  } catch {
    return { ok: false, error: "ネットワークエラー" };
  }
}
