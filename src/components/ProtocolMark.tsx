import type { ReactNode } from "react";
import type { ProtocolColorId, ProtocolIconId } from "@/lib/protocol-colors";
import { PROTOCOL_COLORS } from "@/lib/protocol-colors";

function SproutGlyph({ className }: { className?: string }) {
  /* 双葉: 短い茎＋左右に開いた丸みのある子葉（Y字に見えないよう葉を大きく） */
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path
        d="M12 20V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* 左の子葉 */}
      <ellipse
        cx="7.6"
        cy="10.2"
        rx="4.2"
        ry="2.7"
        transform="rotate(-38 7.6 10.2)"
        fill="currentColor"
      />
      {/* 右の子葉 */}
      <ellipse
        cx="16.4"
        cy="10.2"
        rx="4.2"
        ry="2.7"
        transform="rotate(38 16.4 10.2)"
        fill="currentColor"
      />
      {/* 付け根の小さな節 */}
      <circle cx="12" cy="12.8" r="1.15" fill="currentColor" />
    </svg>
  );
}

function CheckGlyph({ className }: { className?: string }) {
  /* ☑: 塗り四角＋白チェック（線だけより認識しやすい） */
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="3"
        fill="currentColor"
      />
      <path
        d="M7.8 12.2l2.8 2.8 5.6-5.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        fill={filled ? "currentColor" : "currentColor"}
        fillOpacity={filled ? 1 : 0.22}
      />
    </svg>
  );
}

function CrossGlyph({ className }: { className?: string }) {
  /* 塗り四角＋白×（チェックと対になる却下） */
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="3"
        fill="currentColor"
      />
      <path
        d="M8.5 8.5l7 7M15.5 8.5l-7 7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
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
    case "check":
      return <CheckGlyph className={className} />;
    case "bookmark":
      return <BookmarkGlyph className={className} filled={filled} />;
    case "cross":
      return <CrossGlyph className={className} />;
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
    <span className={`inline-flex shrink-0 ${COLOR_CLASS[id]}`}>
      {glyph(def.icon, className, filled)}
    </span>
  );
}
