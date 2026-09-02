const STORAGE_KEY = "viscum_dm_thread_seen_v1";

type SeenMap = Record<string, string>;

function readMap(): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as SeenMap;
  } catch {
    return {};
  }
}

function writeMap(map: SeenMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

export function getDmThreadSeenAt(requestId: string): string | null {
  const v = readMap()[requestId];
  return typeof v === "string" && v ? v : null;
}

export function getDmThreadSeenMap(): SeenMap {
  return readMap();
}

/** スレを開いたときに最終閲覧時刻を記録 */
export function markDmThreadSeen(requestId: string, atIso?: string) {
  const id = requestId.trim();
  if (!id) return;
  const map = readMap();
  map[id] = atIso || new Date().toISOString();
  writeMap(map);
}
