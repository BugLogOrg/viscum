/** 依存なしの軽量折れ線（成績シート用） */
export function Sparkline({
  values,
  className = "",
  heightClass = "h-24",
  stroke = "var(--viscum-leaf-deep)",
  fill = "color-mix(in srgb, var(--viscum-leaf-soft) 70%, transparent)",
}: {
  values: number[];
  className?: string;
  heightClass?: string;
  stroke?: string;
  fill?: string;
}) {
  const w = 320;
  const h = 96;
  const padX = 6;
  const padY = 8;

  if (values.length < 2) {
    return (
      <div
        className={`flex ${heightClass} items-center justify-center text-[12px] text-viscum-muted ${className}`}
      >
        データが足りません
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * (w - padX * 2);
    const y = h - padY - ((v - min) / range) * (h - padY * 2);
    return { x, y };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = [
    `${coords[0]!.x},${h - padY}`,
    ...coords.map((c) => `${c.x},${c.y}`),
    `${coords[coords.length - 1]!.x},${h - padY}`,
  ].join(" ");

  const last = coords[coords.length - 1]!;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`${heightClass} w-full ${className}`}
      role="img"
      aria-hidden
    >
      <polygon points={area} fill={fill} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last.x} cy={last.y} r="4" fill={stroke} />
    </svg>
  );
}
