/** 端末内のフォローグラフ。viewer（自分の英語ID）ごとに保存。本番はサーバ購読へ。 */

const KEY = "viscum_follows_v1";
export const FOLLOWS_UPDATED = "viscum-follows-updated";

type FollowMap = Record<string, string[]>;

function normalize(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

function readMap(): FollowMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FollowMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: FollowMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(FOLLOWS_UPDATED));
}

export function listFollowing(viewerHandle: string): string[] {
  const key = normalize(viewerHandle);
  if (!key) return [];
  const list = readMap()[key] ?? [];
  return list.map((h) => h.toLowerCase());
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
