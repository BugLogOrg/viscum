import type { RequestDm, RequestDmStatus } from "@/lib/local-request-dms";

export async function fetchMyRequests(): Promise<{
  requests: RequestDm[];
  persisted: boolean;
}> {
  try {
    const res = await fetch("/api/requests", { cache: "no-store" });
    if (!res.ok) return { requests: [], persisted: false };
    const data = (await res.json()) as {
      requests?: RequestDm[];
      persisted?: boolean;
    };
    return {
      requests: Array.isArray(data.requests) ? data.requests : [],
      persisted: Boolean(data.persisted),
    };
  } catch {
    return { requests: [], persisted: false };
  }
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
    return { ok: true, request: data.request };
  } catch {
    return { ok: false, error: "ネットワークエラー" };
  }
}
