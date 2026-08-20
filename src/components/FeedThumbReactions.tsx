"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { formatCount } from "@/data/dummy-works";
import {
  hasReaction,
  toggleReaction,
  type ReactionKind,
} from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";

/** TOPサムネ下：ハート＝スキ／目＝気になる（他ユーザ込み件数つき） */
export function FeedThumbReactions({
  workId,
  title,
  sukiBase = 0,
  bookmarkBase = 0,
}: {
  workId: string;
  title: string;
  /** 他ユーザ分のスキ件数（デモ／集計） */
  sukiBase?: number;
  /** 他ユーザ分の気になる件数 */
  bookmarkBase?: number;
}) {
  const [sukiOn, setSukiOn] = useState(false);
  const [bmOn, setBmOn] = useState(false);

  useEffect(() => {
    setSukiOn(hasReaction(workId, "suki"));
    setBmOn(hasReaction(workId, "bookmark"));
  }, [workId]);

  function onToggle(e: MouseEvent, kind: ReactionKind) {
    e.preventDefault();
    e.stopPropagation();
    const { on } = toggleReaction(workId, kind, title);
    if (kind === "suki") {
      setSukiOn(on);
      if (on) bumpLocalSeedStat(workId, "emoCount");
    } else {
      setBmOn(on);
      if (on) bumpLocalSeedStat(workId, "bookmarkCount");
    }
  }

  const sukiN = sukiBase + (sukiOn ? 1 : 0);
  const bmN = bookmarkBase + (bmOn ? 1 : 0);

  return (
    <div
      className="mt-1 flex items-center justify-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title={sukiOn ? `スキ済み · ${sukiN}` : `スキ · ${sukiN}`}
        aria-label={sukiOn ? `スキ済み ${sukiN}` : `スキ ${sukiN}`}
        aria-pressed={sukiOn}
        onClick={(e) => onToggle(e, "suki")}
        className={`inline-flex items-center gap-0.5 rounded-md px-1 py-1 transition ${
          sukiOn
            ? "text-viscum-berry"
            : "text-viscum-muted hover:bg-viscum-paper-2 hover:text-viscum-berry"
        }`}
      >
        <HeartIcon filled={sukiOn} className="h-4 w-4 shrink-0" />
        <span className="min-w-[1ch] text-[10px] font-medium tabular-nums leading-none">
          {formatCount(sukiN)}
        </span>
      </button>
      <button
        type="button"
        title={bmOn ? `気になる済み · ${bmN}` : `気になる · ${bmN}`}
        aria-label={bmOn ? `気になる済み ${bmN}` : `気になる ${bmN}`}
        aria-pressed={bmOn}
        onClick={(e) => onToggle(e, "bookmark")}
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

function HeartIcon({
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
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20s-7.2-4.35-9.6-8.1C.6 9.15 1.5 5.7 4.65 4.5 6.6 3.75 8.7 4.35 12 7.2c3.3-2.85 5.4-3.45 7.35-2.7 3.15 1.2 4.05 4.65 2.25 7.4C19.2 15.65 12 20 12 20z" />
    </svg>
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
