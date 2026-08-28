import type { ReactNode } from "react";
import type { ProtocolColorId, ProtocolIconId } from "@/lib/protocol-colors";
import { PROTOCOL_COLORS } from "@/lib/protocol-colors";

function SproutGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path
        d="M12 20V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="7.6"
        cy="10.2"
        rx="4.2"
        ry="2.7"
        transform="rotate(-38 7.6 10.2)"
        fill="currentColor"
      />
      <ellipse
        cx="16.4"
        cy="10.2"
        rx="4.2"
        ry="2.7"
        transform="rotate(38 16.4 10.2)"
        fill="currentColor"
      />
      <circle cx="12" cy="12.8" r="1.15" fill="currentColor" />
    </svg>
  );
}

/**
 * 👍相当。絵文字はCSSで色を塗れないので、同形のSVGをプロトコル色で塗る。
 * 塊を太くして小サイズでも手だと読めるようにする。
 */
function ThumbUpGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M13.95 3.55c-.7-1.05-2.15-1.2-3.05-.3L8.2 6.05c-.25.25-.4.6-.4.95v1.35H5.85c-1.35 0-2.4 1.15-2.25 2.5l.9 8.35c.15 1.35 1.3 2.35 2.65 2.35h7.7c1.05 0 2-.65 2.35-1.65l2.55-7.1c.5-1.4-.55-2.85-2-2.85h-3.5V6.2c0-1-.45-1.95-1.3-2.65z"
      />
      <path
        fill="currentColor"
        d="M3.75 10.35h2.35v10.15H3.75c-.7 0-1.25-.55-1.25-1.25v-7.65c0-.7.55-1.25 1.25-1.25z"
      />
    </svg>
  );
}

/** 👎相当。上下反転の手。止まれ役 */
function ThumbDownGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M10.05 20.45c.7 1.05 2.15 1.2 3.05.3l2.7-2.8c.25-.25.4-.6.4-.95v-1.35h1.95c1.35 0 2.4-1.15 2.25-2.5l-.9-8.35c-.15-1.35-1.3-2.35-2.65-2.35h-7.7c-1.05 0-2 .65-2.35 1.65L4.25 9.4c-.5 1.4.55 2.85 2 2.85h3.5v2.55c0 1 .45 1.95 1.3 2.65z"
      />
      <path
        fill="currentColor"
        d="M20.25 13.65h-2.35V3.5h2.35c.7 0 1.25.55 1.25 1.25v7.65c0 .7-.55 1.25-1.25 1.25z"
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
    case "thumbUp":
      return <ThumbUpGlyph className={className} />;
    case "bookmark":
      return <BookmarkGlyph className={className} filled={filled} />;
    case "thumbDown":
      return <ThumbDownGlyph className={className} />;
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
