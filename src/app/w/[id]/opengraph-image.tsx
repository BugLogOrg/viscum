import { ImageResponse } from "next/og";
import {
  resolveWorkForOg,
  truncateForOg,
  workOgBadge,
} from "@/lib/work-og";

export const alt = "VISCUM 作品カード";
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
  const title = work
    ? truncateForOg(work.title, 90)
    : "作品が見つかりません";
  const thumb =
    work?.thumbUrl?.trim().startsWith("http")
      ? work.thumbUrl.trim()
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
            justifyContent: "space-between",
            padding: "56px 52px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#2f5d3a",
              }}
            >
              VISCUM
            </div>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
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
            <div
              style={{
                display: "flex",
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1.35,
                color: "#1f1a14",
                maxWidth: thumb ? 620 : 1040,
              }}
            >
              {title}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#6b6358",
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
