import { ImageResponse } from "next/og";
import { OgViscumMark } from "@/components/OgViscumMark";
import {
  OG_IMAGE_TITLE_MAX,
  resolveWorkForOg,
  siteOrigin,
  truncateForOg,
  workOgBadge,
} from "@/lib/work-og";

export const alt = "VISCUM | 作品×反応×コンペ 作品カード";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
/** 生成結果をISR的に保持（毎回フォント取得＋描画しない） */
export const revalidate = 86400;

async function loadJpFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@5.2.5/japanese-700-normal.woff",
      { next: { revalidate: 60 * 60 * 24 * 7 } },
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await resolveWorkForOg(id);
  const fontData = await loadJpFont();

  const badge = work ? workOgBadge(work) : "VISCUM";
  const headline = work
    ? truncateForOg(
        work.title?.trim() || work.tagline?.trim() || "",
        OG_IMAGE_TITLE_MAX,
      )
    : "作品が見つかりません";
  const rawThumb = work?.thumbUrl?.trim() || "";
  const thumb = rawThumb.startsWith("http")
    ? rawThumb
    : rawThumb.startsWith("/")
      ? `${siteOrigin()}${rawThumb}`
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: "#f4f0e8",
          fontFamily: fontData ? "NotoSansJP" : "sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            padding: "48px 48px 160px 48px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <OgViscumMark size={46} />
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#2f5d3a",
                lineHeight: 1,
              }}
            >
              VISCUM | 作品×反応×コンペ
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "flex-start",
              marginTop: 22,
              background: "#a84b3a",
              color: "#fff",
              // ロゴ行(28)より大きく、タイトル(40)より小さく
              fontSize: 34,
              fontWeight: 700,
              // JPフォントは見かけ下寄りなので上下パディングを非対称に
              paddingTop: 10,
              paddingBottom: 16,
              paddingLeft: 22,
              paddingRight: 22,
              borderRadius: 12,
              lineHeight: 1,
              height: 64,
            }}
          >
            {badge}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 40,
              fontWeight: 700,
              lineHeight: 1.35,
              color: "#1f1a14",
              maxWidth: thumb ? 620 : 1040,
            }}
          >
            {headline}
          </div>
        </div>
        {thumb ? (
          <div
            style={{
              width: 480,
              height: "100%",
              display: "flex",
              background: "#1f3d28",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt=""
              width={480}
              height={630}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 180,
              height: "100%",
              display: "flex",
              background: "linear-gradient(180deg, #2f5d3a 0%, #1f3d28 100%)",
            }}
          />
        )}
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "NotoSansJP",
              data: fontData,
              style: "normal" as const,
              weight: 700,
            },
          ]
        : [],
    },
  );
}
