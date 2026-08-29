import type { ReactNode } from "react";
import type { ProtocolColorId, ProtocolIconId } from "@/lib/protocol-colors";
import { PROTOCOL_COLORS } from "@/lib/protocol-colors";

/**
 * 別軸：絵文字🌱をそのまま使う。
 * 自前SVGはY／Tに化けやすい。色塗り不可だが🌱自体が緑なのでプロトコル緑と両立する。
 * （👍系は色が乗らない＋誤読があるので絵文字不採用のまま）
 */
function SproutGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <text
        x="12"
        y="16.8"
        textAnchor="middle"
        fontSize="17"
        style={{ userSelect: "none" }}
      >
        🌱
      </text>
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
  return (
    <span className={`inline-flex shrink-0 leading-none ${COLOR_CLASS[id]}`}>
      {glyph(def.icon, className, filled)}
    </span>
  );
}
