"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { formatCount } from "@/data/dummy-works";
import { hasReaction, toggleReaction } from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";

/** TOPサムネ下：気になるのみ（ADR-036） */
export function FeedThumbReactions({
  workId,
  title,
  bookmarkBase = 0,
}: {
  workId: string;
  title: string;
  bookmarkBase?: number;
  /** @deprecated スキ廃止。呼び出し互換のため無視 */
  sukiBase?: number;
}) {
  const [bmOn, setBmOn] = useState(false);

  useEffect(() => {
    setBmOn(hasReaction(workId, "bookmark"));
  }, [workId]);

  function onToggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { on } = toggleReaction(workId, "bookmark", title);
    setBmOn(on);
    if (on) bumpLocalSeedStat(workId, "bookmarkCount");
  }

  const bmN = bookmarkBase + (bmOn ? 1 : 0);

  return (
    <div
      className="flex items-center justify-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title={bmOn ? `気になる済み · ${bmN}` : `気になる · ${bmN}`}
        aria-label={bmOn ? `気になる済み ${bmN}` : `気になる ${bmN}`}
        aria-pressed={bmOn}
        onClick={onToggle}
        className={`inline-flex items-center gap-0.5 rounded-md px-1 py-1 transition ${
          bmOn
            ? "text-viscum-brand"
            : "text-viscum-muted hover:bg-viscum-paper-2 hover:text-viscum-brand"
        }`}
      >
        <EyeIcon filled={bmOn} className="h-4 w-4 shrink-0" />
        <span className="min-w-[1ch] text-[10px] font-medium tabular-nums leading-none">
          {formatCount(bmN)}
        </span>
      </button>
    </div>
  );
}

function EyeIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
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
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
      <circle
        cx="12"
        cy="12"
        r="2.75"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}
