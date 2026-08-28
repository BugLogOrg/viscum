"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { formatCount } from "@/data/dummy-works";
import { hasReaction, toggleReaction } from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";
import { ProtocolDot } from "@/components/ProtocolDot";

/**
 * フィード右下: 当面は🟡気になるのみ（bookmark）。
 * 4色並びは説明なしだと未来行き過ぎなので、語付きの詳細／lab で先に覚える。
 */
export function FeedThumbReactions({
  workId,
  title,
  bookmarkBase = 0,
}: {
  workId: string;
  title: string;
  bookmarkBase?: number;
  /** @deprecated プレースホルダ互換。フィードには出さない */
  greenBase?: number;
  blueBase?: number;
  redBase?: number;
  /** @deprecated スキ廃止。呼び出し互換のため無視 */
  sukiBase?: number;
}) {
  const [bmOn, setBmOn] = useState(false);

  useEffect(() => {
    setBmOn(hasReaction(workId, "bookmark"));
  }, [workId]);

  function onYellow(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { on } = toggleReaction(workId, "bookmark", title);
    setBmOn(on);
    if (on) bumpLocalSeedStat(workId, "bookmarkCount");
  }

  const n = bookmarkBase + (bmOn ? 1 : 0);
  const label = bmOn
    ? `気になる済み · ${formatCount(n)}`
    : `気になる · ${formatCount(n)}`;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={bmOn}
        onClick={onYellow}
        className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition ${
          bmOn ? "bg-viscum-protocol-yellow-soft" : "hover:bg-viscum-paper-2"
        }`}
      >
        <ProtocolDot id="yellow" className="h-2.5 w-2.5" />
        <span
          className={`text-[11px] font-medium tabular-nums leading-none ${
            bmOn ? "text-viscum-ink" : "text-viscum-muted"
          }`}
        >
          {formatCount(n)}
        </span>
      </button>
    </div>
  );
}
