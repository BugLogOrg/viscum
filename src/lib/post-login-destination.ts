/** ログイン／オンボ後の戻り先（招待着地・ご依頼DMなど） */

const KEY = "viscum.postOnboarding";

export function safeInternalPath(
  raw: string | null | undefined,
): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

/** 戻り先を覚える。マジックリンクは別タブなので localStorage も使う */
export function rememberPostLoginDestination(path: string): void {
  const p = safeInternalPath(path);
  if (!p || p === "/") return;
  try {
    localStorage.setItem(KEY, p);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(KEY, p);
  } catch {
    /* ignore */
  }
}

export function readPostLoginDestination(fallback = "/"): string {
  try {
    const a = safeInternalPath(sessionStorage.getItem(KEY));
    if (a) return a;
  } catch {
    /* ignore */
  }
  try {
    const b = safeInternalPath(localStorage.getItem(KEY));
    if (b) return b;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function clearPostLoginDestination(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function consumePostLoginDestination(fallback = "/"): string {
  const next = readPostLoginDestination(fallback);
  clearPostLoginDestination();
  return next === "/dashboard" ? "/" : next;
}

/** マジックリンク着地＝英語ID画面。next に招待URL等を載せる */
export function onboardingHandleHref(next: string): string {
  const p = safeInternalPath(next);
  if (!p || p === "/") return "/onboarding/handle";
  return `/onboarding/handle?next=${encodeURIComponent(p)}`;
}

export function onboardingWelcomeHref(next?: string | null): string {
  const p =
    safeInternalPath(next ?? null) ??
    safeInternalPath(readPostLoginDestination("/"));
  if (!p || p === "/") return "/onboarding/welcome";
  return `/onboarding/welcome?next=${encodeURIComponent(p)}`;
}

/** 直依頼着地・ご依頼DM向けの短い案内 */
export function describePostLoginDestination(path: string): string | null {
  const p = safeInternalPath(path);
  if (!p) return null;
  if (p.startsWith("/dm/i/")) {
    return "ログイン後、届いたお願いのページに戻ります。英語IDの設定のあと、やる／辞退やご依頼DMに進めます。";
  }
  if (p.startsWith("/dashboard/messages")) {
    return "ログイン後、ご依頼DMに戻ります。";
  }
  return null;
}
