import { clearRememberedViewer } from "@/lib/local-follows";
import { readLocalSeeds, writeLocalSeeds } from "@/lib/local-seeds";
import { readRequestDms } from "@/lib/local-request-dms";

const FOLLOWS_KEY = "viscum_follows_v1";
const PROFILES_V2 = "viscum_local_profiles_v2";
const PROFILES_V1 = "viscum_local_profile_v1";
const NOTIFIES_KEY = "viscum_local_notifies_v1";
const PREFS_KEY = "viscum_notify_prefs_v1";
const REACTIONS_KEY = "viscum_local_reactions_v1";
const REQUEST_DMS_KEY = "viscum_local_request_dms_v1";
const PF_WALL_PREFIX = "viscum_local_pf_wall_v1_";
const COMMENTS_PREFIX = "viscum_local_comments_v1_";

function normalize(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

/**
 * この端末に残った、当該アカウント向けの控えを消す。
 * 他ユーザーのデモデータまで一気に消さない（シードは自分が並べたものだけ）。
 */
export function clearAccountLocalData(handle: string) {
  if (typeof window === "undefined") return;
  const key = normalize(handle);
  if (!key) return;

  try {
    const mapRaw = localStorage.getItem(PROFILES_V2);
    if (mapRaw) {
      const map = JSON.parse(mapRaw) as Record<string, unknown>;
      if (map && typeof map === "object") {
        delete map[key];
        // 大文字小文字ゆれ
        for (const k of Object.keys(map)) {
          if (normalize(k) === key) delete map[k];
        }
        localStorage.setItem(PROFILES_V2, JSON.stringify(map));
      }
    }
    localStorage.removeItem(PROFILES_V1);
  } catch {
    /* ignore */
  }

  try {
    const followsRaw = localStorage.getItem(FOLLOWS_KEY);
    if (followsRaw) {
      const map = JSON.parse(followsRaw) as Record<string, string[]>;
      if (map && typeof map === "object") {
        delete map[key];
        for (const viewer of Object.keys(map)) {
          map[viewer] = (map[viewer] ?? []).filter((h) => normalize(h) !== key);
        }
        localStorage.setItem(FOLLOWS_KEY, JSON.stringify(map));
      }
    }
  } catch {
    /* ignore */
  }

  writeLocalSeeds(
    readLocalSeeds().filter((s) => normalize(s.seederHandle) !== key),
  );

  try {
    const dms = readRequestDms().filter(
      (d) => normalize(d.fromHandle) !== key && normalize(d.toHandle) !== key,
    );
    localStorage.setItem(REQUEST_DMS_KEY, JSON.stringify(dms.slice(0, 40)));
  } catch {
    /* ignore */
  }

  localStorage.removeItem(PF_WALL_PREFIX + key);
  localStorage.removeItem(NOTIFIES_KEY);
  localStorage.removeItem(PREFS_KEY);
  localStorage.removeItem(REACTIONS_KEY);

  // コメントは作品単位キー。全走査は重いので prefix 付きをざっと掃除
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(COMMENTS_PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }

  clearRememberedViewer();
}
