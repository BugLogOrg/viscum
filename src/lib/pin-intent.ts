/**
 * 投稿フォームの「公開したらすぐピン」☑ を、公開ステップ（作品ページ）まで持ち越す。
 * 作品は下書きで保存→作品ページで公開、の二段なので、ここで橋渡しする（端末内・sessionStorage）。
 */
const KEY_PREFIX = "viscum_pin_intent:";

export function markPinIntent(workId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY_PREFIX + workId, "1");
  } catch {
    /* ignore */
  }
}

export function takePinIntent(workId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const k = KEY_PREFIX + workId;
    const v = sessionStorage.getItem(k);
    if (v) sessionStorage.removeItem(k);
    return Boolean(v);
  } catch {
    return false;
  }
}

export function hasPinIntent(workId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(sessionStorage.getItem(KEY_PREFIX + workId));
  } catch {
    return false;
  }
}
