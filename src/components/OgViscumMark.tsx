/** OG ImageResponse 用。Satori は外部SVGより div ロゴの方が安定 */
export function OgViscumMark({ size = 44 }: { size?: number }) {
  const berry = Math.round(size * 0.28);
  const inner = Math.round(size * 0.82);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: "#2db5a0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: Math.round(inner / 2),
          background: "#0f7a6b",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.12),
          right: Math.round(size * 0.12),
          width: berry,
          height: berry,
          borderRadius: Math.round(berry / 2),
          background: "#c45c3e",
        }}
      />
    </div>
  );
}
