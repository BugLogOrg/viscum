import type { ReactNode } from "react";
import type { ProtocolColorId, ProtocolIconId } from "@/lib/protocol-colors";
import { PROTOCOL_COLORS } from "@/lib/protocol-colors";

function SparkGlyph({ className }: { className?: string }) {
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
      <path d="M12 3.5v3.2M12 17.3v3.2M3.5 12h3.2M17.3 12h3.2" />
      <path d="M6.2 6.2l2.2 2.2M15.6 15.6l2.2 2.2M17.8 6.2l-2.2 2.2M8.4 15.6l-2.2 2.2" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckGlyph({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="8.25" />
      <path d="M8.2 12.2l2.6 2.6 5-5.2" />
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
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

function CrossGlyph({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="8.25" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

function glyph(
  icon: ProtocolIconId,
  className: string | undefined,
  filled?: boolean,
): ReactNode {
  switch (icon) {
    case "spark":
      return <SparkGlyph className={className} />;
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
