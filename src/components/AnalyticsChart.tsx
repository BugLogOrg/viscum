"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatDateAxis,
  formatDateJa,
  formatDateShort,
  type ReachDay,
} from "@/lib/reach-series";

export type AnalyticsMetric = "views" | "emo" | "bookmark" | "comment";

export const ANALYTICS_METRIC_LABEL: Record<AnalyticsMetric, string> = {
  views: "閲覧",
  emo: "EMO",
  bookmark: "気になる",
  comment: "コメント",
};

/**
 * YouTubeアナリティクス風：日付軸・右Y軸・選択日ツールチップ。
 * Viscumの紙トーン（ダークにはしない）。
 */
export function AnalyticsChart({
  days,
  metric = "views",
}: {
  days: ReachDay[];
  metric?: AnalyticsMetric;
}) {
  const [selected, setSelected] = useState(days.length - 1);

  useEffect(() => {
    setSelected(Math.max(0, days.length - 1));
  }, [metric, days.length]);

  const values = useMemo(() => days.map((d) => d[metric]), [days, metric]);
  const max = Math.max(1, ...values);
  const yTicks = useMemo(() => {
    const step = niceStep(max);
    const top = Math.ceil(max / step) * step || step;
    const ticks: number[] = [];
    for (let v = 0; v <= top; v += step) ticks.push(v);
    return ticks;
  }, [max]);
  const yMax = yTicks[yTicks.length - 1] ?? 1;

  const w = 360;
  const h = 168;
  const padL = 8;
  const padR = 36;
  const padT = 16;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const coords = values.map((v, i) => {
    const x = padL + (i / Math.max(1, values.length - 1)) * plotW;
    const y = padT + plotH - (v / yMax) * plotH;
    return { x, y, v };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const sel = coords[selected] ?? coords[coords.length - 1];
  const selDay = days[selected] ?? days[days.length - 1];

  const xLabelIdx = useMemo(() => {
    const n = days.length;
    if (n <= 1) return [0];
    const want = 5;
    const step = Math.max(1, Math.floor((n - 1) / (want - 1)));
    const idx: number[] = [];
    for (let i = 0; i < n; i += step) idx.push(i);
    if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
    return idx;
  }, [days.length]);

  if (days.length < 2 || !sel || !selDay) {
    return (
      <p className="py-8 text-center text-[12px] text-viscum-muted">
        データが足りません
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative min-h-[2.5rem]">
        <div className="inline-block rounded-md border border-viscum-line bg-viscum-paper-2/90 px-2.5 py-1.5 shadow-sm">
          <p className="text-[11px] text-viscum-muted">
            {formatDateJa(selDay.date)}
          </p>
          <p className="text-[20px] font-semibold tabular-nums leading-tight text-viscum-brand">
            {selDay[metric]}
          </p>
          <p className="text-[10px] text-viscum-muted">
            {ANALYTICS_METRIC_LABEL[metric]}
          </p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-44 w-full touch-manipulation"
        role="img"
        aria-label={`${ANALYTICS_METRIC_LABEL[metric]}の日次推移`}
      >
        {yTicks.map((t) => {
          const y = padT + plotH - (t / yMax) * plotH;
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={w - padR}
                y1={y}
                y2={y}
                stroke="var(--viscum-line)"
                strokeWidth="1"
              />
              <text
                x={w - padR + 6}
                y={y + 3}
                fill="var(--viscum-ink-muted)"
                fontSize="9"
              >
                {t}
              </text>
            </g>
          );
        })}

        <polyline
          points={line}
          fill="none"
          stroke="var(--viscum-leaf-deep)"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {coords.map((c, i) => (
          <circle
            key={days[i]!.date}
            cx={c.x}
            cy={c.y}
            r={i === selected ? 5 : 3}
            fill={
              i === selected
                ? "var(--viscum-leaf-deep)"
                : "var(--viscum-paper)"
            }
            stroke="var(--viscum-leaf-deep)"
            strokeWidth="2"
            className="cursor-pointer"
            onClick={() => setSelected(i)}
          />
        ))}

        {/* タップ領域 */}
        {coords.map((c, i) => (
          <rect
            key={`hit-${days[i]!.date}`}
            x={c.x - plotW / values.length / 2}
            y={padT}
            width={plotW / values.length}
            height={plotH}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => setSelected(i)}
          />
        ))}

        <line
          x1={sel.x}
          x2={sel.x}
          y1={padT}
          y2={padT + plotH}
          stroke="var(--viscum-bark)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {xLabelIdx.map((i) => {
          const c = coords[i]!;
          const iso = days[i]!.date;
          return (
            <text
              key={iso}
              x={c.x}
              y={h - 8}
              textAnchor="middle"
              fill="var(--viscum-ink-muted)"
              fontSize="8"
            >
              {formatDateAxis(iso)}
            </text>
          );
        })}
      </svg>

      <p className="text-[10px] text-viscum-muted">
        点やグラフをタップすると日付の数字が切り替わります（
        {formatDateShort(days[0]!.date)}〜
        {formatDateShort(days[days.length - 1]!.date)}）
      </p>
    </div>
  );
}

function niceStep(max: number): number {
  if (max <= 5) return 1;
  if (max <= 15) return 5;
  if (max <= 40) return 10;
  if (max <= 80) return 20;
  return 25;
}
