"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import type { ProtocolColorId, ProtocolIconId } from "@/lib/protocol-colors";
import { PROTOCOL_COLORS } from "@/lib/protocol-colors";

/** Apple seedling-like fixed asset (not OS emoji). Gradients use useId to avoid collisions. */
function SproutGlyph({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const soil = `ps-soil-${uid}`;
  const leafL = `ps-leaf-l-${uid}`;
  const leafR = `ps-leaf-r-${uid}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient
          id={soil}
          x1="5"
          y1="17"
          x2="19"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#C9A36E" />
          <stop offset="1" stopColor="#A67C45" />
        </linearGradient>
        <linearGradient
          id={leafL}
          x1="4"
          y1="6"
          x2="11"
          y2="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9CCC65" />
          <stop offset="1" stopColor="#689F38" />
        </linearGradient>
        <linearGradient
          id={leafR}
          x1="12"
          y1="4"
          x2="20"
          y2="13"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#AED581" />
          <stop offset="1" stopColor="#7CB342" />
        </linearGradient>
      </defs>
      <ellipse cx="12" cy="19.6" rx="7.2" ry="2.55" fill={`url(#${soil})`} />
      <ellipse
        cx="12"
        cy="18.85"
        rx="5.4"
        ry="1.55"
        fill="#D7B688"
        opacity="0.85"
      />
      <path
        d="M11.85 18.4c.05-2.2.35-4.4.85-6.15"
        stroke="#8BC34A"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <path
        d="M12.3 12.6c-1.55-.15-4.2-1.1-5.85-2.95-1.55-1.75-.35-3.85 1.85-3.55 1.9.25 3.55 2.55 4.35 5.35.15.55.05 1.05-.35 1.15z"
        fill={`url(#${leafL})`}
      />
      <path
        d="M12.55 12.15c1.35-.85 3.95-2.55 5.55-3.05 2.05-.65 3.05 1.35 1.55 3.15-1.35 1.6-3.85 2.85-5.95 3.15-.7.1-1.2-.35-1.15-1.25z"
        fill={`url(#${leafR})`}
      />
      <path
        d="M8.2 8.35c.85.15 1.85.95 2.45 1.95"
        stroke="#E8F5C8"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M14.1 10.1c1.05-.35 2.35-.55 3.25-.45"
        stroke="#F1F8E0"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** 賛成・通る：丸＋チェック（小サイズでも記号として読める） */
function CheckCircleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.25" fill="currentColor" />
      <path
        d="M7.8 12.15l2.85 2.85 5.55-5.7"
        fill="none"
        stroke="#f7f3eb"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 止まれ：八角＋横棒（標識の世界語） */
function StopOctagonGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M8.15 3.35h7.7l4.8 4.8v7.7l-4.8 4.8h-7.7l-4.8-4.8v-7.7l4.8-4.8z"
      />
      <path
        d="M7.2 12h9.6"
        fill="none"
        stroke="#f7f3eb"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookmarkGlyph({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M7.5 4.5h9a1 1 0 0 1 1 1v14l-5.5-3.2L6.5 19.5v-14a1 1 0 0 1 1-1z"
        fill="currentColor"
        fillOpacity={filled ? 1 : 0.22}
      />
    </svg>
  );
}

function glyph(
  icon: ProtocolIconId,
  className: string | undefined,
  filled?: boolean,
): ReactNode {
  switch (icon) {
    case "sprout":
      return <SproutGlyph className={className} />;
    case "checkCircle":
      return <CheckCircleGlyph className={className} />;
    case "bookmark":
      return <BookmarkGlyph className={className} filled={filled} />;
    case "stopOctagon":
      return <StopOctagonGlyph className={className} />;
  }
}

const COLOR_CLASS: Record<ProtocolColorId, string> = {
  green: "text-viscum-protocol-green",
  blue: "text-viscum-protocol-blue",
  yellow: "text-viscum-protocol-yellow",
  red: "text-viscum-protocol-red",
};

/** 色＋アイコン（CUDの形） */
export function ProtocolMark({
  id,
  filled,
  className = "h-3.5 w-3.5",
}: {
  id: ProtocolColorId;
  filled?: boolean;
  className?: string;
}) {
  const def = PROTOCOL_COLORS.find((c) => c.id === id)!;
  // 芽は土があるので視覚重心が下がりやすい → 緑だけ 3px 上げ（2026-08-29 mDB OK）
  const optical = id === "green" ? "-translate-y-[3px]" : "";
  return (
    <span
      className={`inline-flex shrink-0 leading-none ${optical} ${COLOR_CLASS[id]}`}
    >
      {glyph(def.icon, className, filled)}
    </span>
  );
}
