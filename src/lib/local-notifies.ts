/** 通知デモ（端末内。本番はサーバ配信） */

export type NotifyKind =
  | "comment"
  | "adopt_pay"
  | "tip_received"
  | "follow"
  | "deadline"
  | "direct_request";

export type LocalNotify = {
  id: string;
  kind: NotifyKind;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
  /** シーダー向け / メンター向け（参加レーダーは初期オフ） */
  audience: "seeder" | "mentor";
};

const KEY = "viscum_local_notifies_v1";
const PREFS_KEY = "viscum_notify_prefs_v1";

export type NotifyPrefs = {
  /** フォロー中シーダーの開催・自分のシードへの反応など */
  seederAlerts: boolean;
  /**
   * フォロー中メンターの「参加した作品」通知。
   * 初期 false（賞金レーダー化を避ける）。本人がONにできる。
   */
  mentorParticipateAlerts: boolean;
};

const DEFAULT_PREFS: NotifyPrefs = {
  seederAlerts: true,
  mentorParticipateAlerts: false,
};

export function readNotifyPrefs(): NotifyPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as NotifyPrefs) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writeNotifyPrefs(prefs: NotifyPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function readLocalNotifies(): LocalNotify[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalNotify[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalNotifies(rows: LocalNotify[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 80)));
}

export function unreadNotifyCount(prefs?: NotifyPrefs): number {
  const p = prefs ?? readNotifyPrefs();
  return readLocalNotifies().filter((n) => {
    if (n.read) return false;
    if (n.audience === "seeder" && !p.seederAlerts) return false;
    if (n.audience === "mentor" && !p.mentorParticipateAlerts) return false;
    return true;
  }).length;
}

export function visibleNotifies(prefs?: NotifyPrefs): LocalNotify[] {
  const p = prefs ?? readNotifyPrefs();
  return readLocalNotifies()
    .filter((n) => {
      if (n.audience === "seeder" && !p.seederAlerts) return false;
      if (n.audience === "mentor" && !p.mentorParticipateAlerts) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markAllNotifiesRead() {
  writeLocalNotifies(
    readLocalNotifies().map((n) => ({ ...n, read: true })),
  );
}

export function markNotifyRead(id: string) {
  writeLocalNotifies(
    readLocalNotifies().map((n) =>
      n.id === id ? { ...n, read: true } : n,
    ),
  );
}

/** 見た目確認用のデモ通知（シーダー主＋メンター参加は1件・設定OFFなら見えない） */
export function installDemoNotifies() {
  const now = Date.now();
  const demos: LocalNotify[] = [
    {
      id: "n_demo_direct_request",
      kind: "direct_request",
      title: "ご依頼が届きました",
      body: "ken さんから直依頼（デモ）。やる／いまは無理が返せます。",
      href: "/dashboard/messages/req_demo_01",
      createdAt: new Date(now - 12 * 60000).toISOString(),
      read: false,
      audience: "seeder",
    },
    {
      id: "n_demo_comment",
      kind: "comment",
      title: "新しいコメント",
      body: "あなたのシード「宅配ボックスIoTの15秒プロモ」にコメントが付きました。",
      href: "/w/promo-15s",
      createdAt: new Date(now - 20 * 60000).toISOString(),
      read: false,
      audience: "seeder",
    },
    {
      id: "n_demo_deadline",
      kind: "deadline",
      title: "締切が近づいています",
      body: "開催中のシードがあと約1日で締切です。",
      href: "/dashboard",
      createdAt: new Date(now - 3 * 3600000).toISOString(),
      read: false,
      audience: "seeder",
    },
    {
      id: "n_demo_follow",
      kind: "follow",
      title: "フォローされました",
      body: "@ayu があなたをフォローしました。",
      href: "/u/ayu",
      createdAt: new Date(now - 26 * 3600000).toISOString(),
      read: true,
      audience: "seeder",
    },
    {
      id: "n_demo_tip",
      kind: "tip_received",
      title: "チップを受け取りました",
      body: "コメントが採用され、チップの支払いが完了しました（デモ）。",
      href: "/u/mDB",
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      read: true,
      audience: "seeder",
    },
    {
      id: "n_demo_mentor_join",
      kind: "comment",
      title: "フォロー中メンターの参加",
      body: "（設定ONのときだけ）@ken が別の開催中にコメントしました。初期はOFFです。",
      href: "/w/note-clip",
      createdAt: new Date(now - 40 * 60000).toISOString(),
      read: false,
      audience: "mentor",
    },
  ];
  const rest = readLocalNotifies().filter((n) => !n.id.startsWith("n_demo_"));
  writeLocalNotifies([...demos, ...rest]);
}

export function clearDemoNotifies() {
  writeLocalNotifies(
    readLocalNotifies().filter((n) => !n.id.startsWith("n_demo_")),
  );
}

export function formatNotifyStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
}
