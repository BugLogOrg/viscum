/** クライアントから通知 API を叩く薄いラッパ（TTL＋inflight 共有で二重マウント対策） */

import {
  readNotifyPrefs,
  type LocalNotify,
  type NotifyKind,
} from "@/lib/local-notifies";

export type RemoteNotify = LocalNotify & { kind: NotifyKind | "follow_seed" };

const TTL_MS = 15_000;

let cache:
  | {
      at: number;
      prefsKey: string;
      value: {
        notifications: RemoteNotify[];
        unread: number;
        persisted: boolean;
      };
    }
  | null = null;
let inflight: Promise<{
  notifications: RemoteNotify[];
  unread: number;
  persisted: boolean;
}> | null = null;

function prefsQuery(): string {
  const p = readNotifyPrefs();
  const q = new URLSearchParams();
  if (!p.seederAlerts) q.set("seeder", "0");
  if (!p.mentorParticipateAlerts) q.set("mentor", "0");
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchRemoteNotifies(opts?: {
  force?: boolean;
}): Promise<{
  notifications: RemoteNotify[];
  unread: number;
  persisted: boolean;
}> {
  const prefsKey = prefsQuery();
  const now = Date.now();
  if (
    !opts?.force &&
    cache &&
    cache.prefsKey === prefsKey &&
    now - cache.at < TTL_MS
  ) {
    return cache.value;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(`/api/notifications${prefsKey}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        return { notifications: [], unread: 0, persisted: false };
      }
      const data = (await res.json()) as {
        notifications?: RemoteNotify[];
        unread?: number;
        persisted?: boolean;
      };
      const value = {
        notifications: data.notifications ?? [],
        unread: data.unread ?? 0,
        persisted: Boolean(data.persisted),
      };
      cache = { at: Date.now(), prefsKey, value };
      return value;
    } catch {
      return { notifications: [], unread: 0, persisted: false };
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function markRemoteNotifyRead(id: string): Promise<void> {
  try {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    cache = null;
  } catch {
    /* ignore */
  }
}

export async function markAllRemoteNotifiesRead(): Promise<void> {
  try {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    cache = null;
  } catch {
    /* ignore */
  }
}
