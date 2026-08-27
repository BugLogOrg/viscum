import { ImageResponse } from "next/og";

export const alt = "VISCUM | 広告×コンペ";
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

export default async function Image() {
  const fontData = await loadJpFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(135deg, #2f5d3a 0%, #1f3d28 55%, #a84b3a 140%)",
          fontFamily: fontData ? "NotoSansJP" : "sans-serif",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, letterSpacing: "0.08em" }}>
          VISCUM | 広告×コンペ
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.3,
            maxWidth: 900,
          }}
        >
          出して、聞いて、ブースト
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 28,
            opacity: 0.9,
          }}
        >
          作ったものを出して、最初の反応を集める場所
        </div>
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
