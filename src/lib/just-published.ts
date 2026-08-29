/** 公開直後バナー用。URLに残さない（ロゴ／すべてで消える） */
const KEY = "viscum_just_published_id";

export function markJustPublished(workId: string) {
  if (typeof window === "undefined") return;
  const id = workId.trim();
  if (!id) return;
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* private mode 等 */
  }
}

/** バナー表示用に読む（消さない。clear はホーム／すべてで） */
export function peekJustPublished(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function clearJustPublished() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
