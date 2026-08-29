/** クライアントから通知 API を叩く薄いラッパ（TTL＋inflight 共有で二重マウント対策） */

import {
  readNotifyPrefs,
  type LocalNotify,
  type NotifyKind,
} from "@/lib/local-notifies";

export type RemoteNotify = LocalNotify & { kind: NotifyKind | "follow_seed" };

const LIST_TTL_MS = 15_000;
const UNREAD_TTL_MS = 30_000;

let listCache:
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
let listInflight: Promise<{
  notifications: RemoteNotify[];
  unread: number;
  persisted: boolean;
}> | null = null;

let unreadCache:
  | { at: number; prefsKey: string; unread: number }
  | null = null;
let unreadInflight: Promise<number> | null = null;

function prefsQuery(): string {
  const p = readNotifyPrefs();
  const q = new URLSearchParams();
  if (!p.seederAlerts) q.set("seeder", "0");
  if (!p.mentorParticipateAlerts) q.set("mentor", "0");
  const s = q.toString();
  return s ? `?${s}` : "";
}

function prefsKey(): string {
  return prefsQuery();
}

/** キャッシュがあれば同期で返す（ページ初回の点滅防止） */
export function peekRemoteNotifiesCache(): {
  notifications: RemoteNotify[];
  unread: number;
  persisted: boolean;
} | null {
  if (!listCache) return null;
  if (listCache.prefsKey !== prefsKey()) return null;
  if (Date.now() - listCache.at >= LIST_TTL_MS) return null;
  return listCache.value;
}

export async function fetchRemoteNotifies(opts?: {
  force?: boolean;
}): Promise<{
  notifications: RemoteNotify[];
  unread: number;
  persisted: boolean;
}> {
  const key = prefsKey();
  const now = Date.now();
  if (
    !opts?.force &&
    listCache &&
    listCache.prefsKey === key &&
    now - listCache.at < LIST_TTL_MS
  ) {
    return listCache.value;
  }
  if (listInflight) return listInflight;

  listInflight = (async () => {
    try {
      const res = await fetch(`/api/notifications${key}`, {
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
      listCache = { at: Date.now(), prefsKey: key, value };
      unreadCache = { at: Date.now(), prefsKey: key, unread: value.unread };
      return value;
    } catch {
      return { notifications: [], unread: 0, persisted: false };
    } finally {
      listInflight = null;
    }
  })();

  return listInflight;
}

/** ヘッダ用：未読件数だけ（一覧は取らない） */
export async function fetchRemoteUnreadCount(opts?: {
  force?: boolean;
}): Promise<number> {
  const key = prefsKey();
  const now = Date.now();
  if (
    !opts?.force &&
    unreadCache &&
    unreadCache.prefsKey === key &&
    now - unreadCache.at < UNREAD_TTL_MS
  ) {
    return unreadCache.unread;
  }
  if (
    !opts?.force &&
    listCache &&
    listCache.prefsKey === key &&
    now - listCache.at < LIST_TTL_MS
  ) {
    return listCache.value.unread;
  }
  if (unreadInflight) return unreadInflight;

  unreadInflight = (async () => {
    try {
      const sep = key ? "&" : "?";
      const res = await fetch(`/api/notifications${key}${sep}unread=1`, {
        cache: "no-store",
      });
      if (!res.ok) return 0;
      const data = (await res.json()) as { unread?: number };
      const unread = data.unread ?? 0;
      unreadCache = { at: Date.now(), prefsKey: key, unread };
      return unread;
    } catch {
      return 0;
    } finally {
      unreadInflight = null;
    }
  })();

  return unreadInflight;
}

export function invalidateRemoteNotifyCache() {
  listCache = null;
  unreadCache = null;
}

export async function markRemoteNotifyRead(id: string): Promise<void> {
  try {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    invalidateRemoteNotifyCache();
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
    invalidateRemoteNotifyCache();
  } catch {
    /* ignore */
  }
}
