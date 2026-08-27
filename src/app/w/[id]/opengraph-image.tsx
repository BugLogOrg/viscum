import { ImageResponse } from "next/og";
import {
  resolveWorkForOg,
  siteOrigin,
  workOgBadge,
} from "@/lib/work-og";

export const alt = "VISCUM | 広告×コンペ 作品カード";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
  const work = resolveWorkForOg(id);
  const fontData = await loadJpFont();

  const badge = work ? workOgBadge(work) : "VISCUM";
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
            // 下〜140pxは X の title 黒帯領域。文言は上寄せのみ
            padding: "48px 48px 160px 48px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#2f5d3a",
            }}
          >
            VISCUM | 広告×コンペ
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 22,
              background: "#a84b3a",
              color: "#fff",
              fontSize: 26,
              fontWeight: 700,
              padding: "10px 18px",
              borderRadius: 10,
            }}
          >
            {badge}
          </div>
          {/* タイトルは X 黒帯側。画像内はスローガンを上寄せで見せる */}
          <div
            style={{
              display: "flex",
              marginTop: 36,
              fontSize: 36,
              fontWeight: 700,
              color: "#6b6358",
              letterSpacing: "0.02em",
            }}
          >
            出して、聞いて、ブースト
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
