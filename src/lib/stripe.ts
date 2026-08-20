import Stripe from "stripe";

export function hasStripe(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, {
    apiVersion: "2025-08-27.basil",
    typescript: true,
  });
}

/** 有料下限（ADR-031） */
export const MIN_ADOPT_YEN = 5000;
export const MAX_ADOPT_YEN = 500_000;

export function clampAdoptYen(raw: number | undefined): number {
  if (!Number.isFinite(raw) || (raw as number) <= 0) return MIN_ADOPT_YEN;
  return Math.min(MAX_ADOPT_YEN, Math.max(MIN_ADOPT_YEN, Math.round(raw as number)));
}

export function appBaseUrl(req?: Request): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (fromEnv) {
    return fromEnv.startsWith("http") ? fromEnv.replace(/\/$/, "") : `https://${fromEnv}`;
  }
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
