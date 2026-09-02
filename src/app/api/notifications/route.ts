import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasDatabase } from "@/db";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/db/notifications";

/**
 * GET — 自分の通知一覧。
 * クエリ seeder=0 / mentor=0 で端末 prefs を反映（既定: 両方ON）。
 * クエリ unread=1 で未読件数だけ（ヘッダ用・一覧は返さない）。
 * PATCH { all?: true, id?: string } — 既読
 */
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || userId.startsWith("demo:")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({
      notifications: [],
      unread: 0,
      persisted: false,
    });
  }

  const url = new URL(req.url);
  const seederAlerts = url.searchParams.get("seeder") !== "0";
  const mentorParticipateAlerts = url.searchParams.get("mentor") !== "0";
  const profileWallAlerts = url.searchParams.get("profile") !== "0";
  const unreadOnly = url.searchParams.get("unread") === "1";

  if (unreadOnly) {
    if (seederAlerts && mentorParticipateAlerts && profileWallAlerts) {
      const unread = await countUnreadNotifications(userId);
      return NextResponse.json({ notifications: [], unread, persisted: true });
    }
  }

  const rows = await listNotificationsForUser(userId);
  const visible = rows.filter((n) => {
    if (n.kind === "profile_wall" && !profileWallAlerts) return false;
    if (
      n.audience === "seeder" &&
      n.kind !== "profile_wall" &&
      !seederAlerts
    )
      return false;
    if (n.audience === "mentor" && !mentorParticipateAlerts) return false;
    return true;
  });
  const unread = visible.filter((n) => !n.read).length;

  if (unreadOnly) {
    return NextResponse.json({ notifications: [], unread, persisted: true });
  }

  return NextResponse.json({
    notifications: visible,
    unread,
    persisted: true,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || userId.startsWith("demo:")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const body = (await req.json().catch(() => null)) as {
    all?: boolean;
    id?: string;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (body.all) {
    const n = await markAllNotificationsRead(userId);
    return NextResponse.json({ ok: true, marked: n, persisted: true });
  }
  if (body.id) {
    const ok = await markNotificationRead(userId, body.id);
    return NextResponse.json({ ok, persisted: true });
  }
  return NextResponse.json({ error: "id or all required" }, { status: 400 });
}
