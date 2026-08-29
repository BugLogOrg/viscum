/** クライアントから通知 API を叩く薄いラッパ */

import {
  readNotifyPrefs,
  type LocalNotify,
  type NotifyKind,
} from "@/lib/local-notifies";

export type RemoteNotify = LocalNotify & { kind: NotifyKind | "follow_seed" };

function prefsQuery(): string {
  const p = readNotifyPrefs();
  const q = new URLSearchParams();
  if (!p.seederAlerts) q.set("seeder", "0");
  if (p.mentorParticipateAlerts) q.set("mentor", "1");
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchRemoteNotifies(): Promise<{
  notifications: RemoteNotify[];
  unread: number;
  persisted: boolean;
}> {
  try {
    const res = await fetch(`/api/notifications${prefsQuery()}`, {
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
    return {
      notifications: data.notifications ?? [],
      unread: data.unread ?? 0,
      persisted: Boolean(data.persisted),
    };
  } catch {
    return { notifications: [], unread: 0, persisted: false };
  }
}

export async function markRemoteNotifyRead(id: string): Promise<void> {
  try {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
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
  } catch {
    /* ignore */
  }
}
