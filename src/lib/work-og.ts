import type { Metadata } from "next";
import {
  formatYen,
  getWork,
  planBadgeLabel,
  type Work,
} from "@/data/dummy-works";

/** 本番・プレビュー用の絶対URL基点 */
export function siteOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "";
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://viscum.vercel.app";
}

/** OG画像URLのクエリ。見た目変更時に上げて X／CDN キャッシュを切る */
export const OG_IMAGE_BUST = "20260828e";


export function truncateForOg(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function workOgBadge(work: Work): string {
  const plan = planBadgeLabel(work.plan);
  if (work.plan === "public_boost") {
    return `公開ブースト · 褒賞 ${formatYen(work.prizeYen ?? 30000)}`;
  }
  if (work.prizeYen != null && work.status !== "none") {
    return `${plan ?? "コンペ"} · 褒賞 ${formatYen(work.prizeYen)}`;
  }
  return plan ?? "コメント歓迎";
}

export function workOgDescription(work: Work): string {
  const body = (work.description || work.tagline || "").trim();
  if (body) return truncateForOg(body, 160);
  return truncateForOg(`${workOgBadge(work)} — VISCUM`, 160);
}

/** サーバで解決できる作品（デモ棚）。端末内 local_ はクロール不可 */
export function resolveWorkForOg(id: string): Work | null {
  return getWork(id) ?? null;
}

export function workPageMetadata(work: Work | null, id: string): Metadata {
  if (!work) {
    return {
      title: "作品が見つかりません | VISCUM",
      description: "VISCUMの作品ページです。",
      robots: { index: false, follow: false },
    };
  }
  // タイトル短運用（ADR-045）。なければ tagline
  const title = truncateForOg(
    work.title?.trim() || work.tagline?.trim() || "",
    100,
  );
  const description = workOgDescription(work);
  const url = `${siteOrigin()}/w/${encodeURIComponent(id)}`;
  const ogImage = `${siteOrigin()}/w/${encodeURIComponent(id)}/opengraph-image?v=${OG_IMAGE_BUST}`;
  return {
    title: `${title} | VISCUM`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url,
      siteName: "VISCUM",
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "VISCUM | 広告×コンペ" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
