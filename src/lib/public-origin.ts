/**
 * 外に出すURLの基点（告知文・OG・メール等）。
 * viscum.vercel.app で開いていても共有は本番ドメインにする。
 */
export const CANONICAL_PUBLIC_ORIGIN = "https://viscum.org";

function stripSlash(s: string): string {
  return s.replace(/\/$/, "");
}

/** vercel.app／空は本番に寄せる。localhost はそのまま */
export function resolvePublicOrigin(hint?: string | null): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "";
  const raw = stripSlash(env || hint || CANONICAL_PUBLIC_ORIGIN);
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const host = new URL(withProto).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return stripSlash(withProto);
    }
    if (host === "viscum.vercel.app" || host.endsWith(".vercel.app")) {
      return CANONICAL_PUBLIC_ORIGIN;
    }
    return stripSlash(withProto);
  } catch {
    return CANONICAL_PUBLIC_ORIGIN;
  }
}

/** ブラウザ上の共有用。location が vercel でも本番URLを返す */
export function clientShareOrigin(): string {
  if (typeof window === "undefined") return resolvePublicOrigin();
  return resolvePublicOrigin(window.location.origin);
}
