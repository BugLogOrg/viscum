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

function ThumbUpGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M14.6 4.2c-.55-.9-1.7-1.15-2.55-.55L9.2 5.7c-.35.25-.55.65-.55 1.1v.7H6.8c-1.2 0-2.15 1-2.1 2.2l.35 8.1c.05 1.15 1 2.05 2.15 2.05h7.35c.9 0 1.7-.55 2.05-1.4l2.1-5.15c.45-1.1-.35-2.3-1.55-2.3h-3.05V6.5c0-.9-.4-1.75-1.1-2.3z"
      />
      <path
        fill="currentColor"
        d="M4.5 9.5h1.8v10H4.5c-.55 0-1-.45-1-1v-8c0-.55.45-1 1-1z"
      />
    </svg>
  );
}

function ThumbDownGlyph({ className }: { className?: string }) {
  /* 賛成の対＝gotoHELL役。上下反転の手 */
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M9.4 19.8c.55.9 1.7 1.15 2.55.55l2.85-2.05c.35-.25.55-.65.55-1.1v-.7h1.85c1.2 0 2.15-1 2.1-2.2l-.35-8.1c-.05-1.15-1-2.05-2.15-2.05H9.45c-.9 0-1.7.55-2.05 1.4L5.3 10.7c-.45 1.1.35 2.3 1.55 2.3h3.05v2.5c0 .9.4 1.75 1.1 2.3z"
      />
      <path
        fill="currentColor"
        d="M19.5 14.5h-1.8v-10h1.8c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1z"
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
    <span className={`inline-flex shrink-0 ${COLOR_CLASS[id]}`}>
      {glyph(def.icon, className, filled)}
    </span>
  );
}
