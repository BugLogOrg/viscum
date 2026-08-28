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

/** 賛成・通る：丸＋チェック（小さな手より残る） */
function CheckCircleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path
        d="M8.2 12.2l2.4 2.4 5.2-5.4"
        fill="none"
        stroke="var(--viscum-paper, #f7f3eb)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 止まれ：八角標識（語と直結） */
function StopOctagonGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M8.2 3.5h7.6l4.7 4.7v7.6l-4.7 4.7H8.2L3.5 15.8V8.2L8.2 3.5z"
      />
      <path
        d="M7.5 12h9"
        fill="none"
        stroke="var(--viscum-paper, #f7f3eb)"
        strokeWidth="2.4"
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
