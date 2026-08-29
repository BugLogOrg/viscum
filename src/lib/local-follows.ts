/** 端末内のフォローグラフ。viewer（自分の英語ID）ごとに保存。本番はサーバ購読へ。 */

const KEY = "viscum_follows_v1";
const LAST_VIEWER_KEY = "viscum_last_viewer_v1";
export const FOLLOWS_UPDATED = "viscum-follows-updated";

type FollowMap = Record<string, string[]>;

function normalize(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

/** キー・値を小文字に揃え、重複キーをマージ（過去データの大文字混在対策） */
function normalizeMap(raw: FollowMap): FollowMap {
  const migrated: FollowMap = {};
  for (const [k, list] of Object.entries(raw)) {
    const nk = normalize(k);
    if (!nk) continue;
    const set = new Set(migrated[nk] ?? []);
    for (const h of list ?? []) {
      const t = normalize(h);
      if (t && t !== nk) set.add(t);
    }
    migrated[nk] = [...set];
  }
  return migrated;
}

function mapsEqual(a: FollowMap, b: FollowMap): boolean {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i += 1) {
    if (ak[i] !== bk[i]) return false;
    const aa = [...(a[ak[i]] ?? [])].sort().join(",");
    const bb = [...(b[bk[i]] ?? [])].sort().join(",");
    if (aa !== bb) return false;
  }
  return true;
}

function readMap(): FollowMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FollowMap;
    if (!parsed || typeof parsed !== "object") return {};
    const normalized = normalizeMap(parsed);
    if (!mapsEqual(parsed, normalized)) {
      try {
        localStorage.setItem(KEY, JSON.stringify(normalized));
      } catch {
        /* ignore quota */
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

function writeMap(map: FollowMap) {
  localStorage.setItem(KEY, JSON.stringify(normalizeMap(map)));
  window.dispatchEvent(new Event(FOLLOWS_UPDATED));
}

/** セッション確定前にフォロー棚を出すための控え */
export function rememberViewer(handle: string) {
  if (typeof window === "undefined") return;
  const key = normalize(handle);
  if (!key) return;
  try {
    sessionStorage.setItem(LAST_VIEWER_KEY, key);
  } catch {
    /* ignore */
  }
}

export function clearRememberedViewer() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(LAST_VIEWER_KEY);
  } catch {
    /* ignore */
  }
}

export function readRememberedViewer(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(LAST_VIEWER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function listFollowing(viewerHandle: string): string[] {
  const key = normalize(viewerHandle);
  if (!key) return [];
  return [...(readMap()[key] ?? [])];
}

export function isFollowing(viewerHandle: string, targetHandle: string): boolean {
  const target = normalize(targetHandle);
  if (!target) return false;
  return listFollowing(viewerHandle).includes(target);
}

export function setFollowing(
  viewerHandle: string,
  targetHandle: string,
  next: boolean,
): boolean {
  const viewer = normalize(viewerHandle);
  const target = normalize(targetHandle);
  if (!viewer || !target || viewer === target) return false;

  const map = readMap();
  const set = new Set(map[viewer] ?? []);
  if (next) set.add(target);
  else set.delete(target);
  map[viewer] = [...set];
  writeMap(map);
  return next;
}

export function toggleFollowing(
  viewerHandle: string,
  targetHandle: string,
): boolean {
  const now = isFollowing(viewerHandle, targetHandle);
  return setFollowing(viewerHandle, targetHandle, !now);
}

/** その人がフォローしている人数 */
export function countFollowing(viewerHandle: string): number {
  return listFollowing(viewerHandle).length;
}

/** その人をフォローしている英語ID一覧（端末内グラフ） */
export function listFollowers(targetHandle: string): string[] {
  const target = normalize(targetHandle);
  if (!target) return [];
  const out: string[] = [];
  for (const [viewer, list] of Object.entries(readMap())) {
    if ((list ?? []).some((h) => normalize(h) === target)) {
      out.push(normalize(viewer));
    }
  }
  return out;
}

/** その人をフォローしている人数（端末内グラフ全体を集計） */
export function countFollowers(targetHandle: string): number {
  return listFollowers(targetHandle).length;
}

/** 重複のない英語ID一覧をマージ（サーバ＋端末） */
export function mergeHandleLists(...lists: string[][]): string[] {
  const set = new Set<string>();
  for (const list of lists) {
    for (const h of list) {
      const n = normalize(h);
      if (n) set.add(n);
    }
  }
  return [...set];
}

/**
 * サーバ側のフォロー中一覧を端末キャッシュへ反映（デモ人物の端末フォローは残す）。
 * `serverFollowing` に無い実アカウント分は消さない（オフライン差分を壊さない）。
 * 追加だけ行う。
 */
export function absorbServerFollowing(
  viewerHandle: string,
  serverFollowing: string[],
) {
  const viewer = normalize(viewerHandle);
  if (!viewer || typeof window === "undefined") return;
  for (const h of serverFollowing) {
    setFollowing(viewer, h, true);
  }
}
