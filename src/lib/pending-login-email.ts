/** Magic Link 送信直後の宛先を、check-email で見失わないための端末メモ */

const KEY = "viscum.pendingLoginEmail";

export function rememberPendingLoginEmail(email: string) {
  if (typeof window === "undefined") return;
  const t = email.trim();
  if (!t) return;
  try {
    sessionStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
}

export function readPendingLoginEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function clearPendingLoginEmail() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
