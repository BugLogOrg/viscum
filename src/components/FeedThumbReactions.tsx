"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatCount } from "@/data/dummy-works";
import { hasReaction, toggleReaction } from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";
import { PROTOCOL_COLORS, type ProtocolColorId } from "@/lib/protocol-colors";
import { ProtocolMark } from "@/components/ProtocolMark";

/** フィードで押せるのは黄（気になる）だけ — サムネ下向け */
export function FeedBookmarkButton({
  workId,
  title,
  bookmarkBase = 0,
}: {
  workId: string;
  title: string;
  bookmarkBase?: number;
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

  const n = bookmarkBase + (bmOn ? 1 : 0);
  const label = bmOn
    ? `気になる済み · ${formatCount(n)}`
    : `気になる · ${formatCount(n)}`;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={bmOn}
      onClick={onToggle}
      className={`inline-flex items-center gap-0.5 rounded-md px-1 py-1 transition ${
        bmOn
          ? "bg-viscum-protocol-yellow-soft text-viscum-ink"
          : "text-viscum-muted hover:bg-viscum-paper-2"
      }`}
    >
      <ProtocolMark id="yellow" filled={bmOn} className="h-5 w-5" />
      <span className="text-[12px] font-medium tabular-nums leading-none">
        {formatCount(n)}
      </span>
    </button>
  );
}

/**
 * 緑・青・赤の件数表示（情報の呼び出し・タップで詳細へ）。
 * フィードでは押せない態度選択ではなく、集計の気配。
 */
export function FeedAttitudeCounts({
  workId,
  greenBase = 0,
  blueBase = 0,
  redBase = 0,
}: {
  workId: string;
  greenBase?: number;
  blueBase?: number;
  redBase?: number;
}) {
  const counts: Partial<Record<ProtocolColorId, number>> = {
    green: greenBase,
    blue: blueBase,
    red: redBase,
  };

  return (
    <div
      className="flex items-center gap-0.5"
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="コメント態度の件数"
    >
      {PROTOCOL_COLORS.filter((c) => c.id !== "yellow").map((c) => {
        const n = counts[c.id] ?? 0;
        return (
          <Link
            key={c.id}
            href={`/w/${workId}`}
            title={`${c.label}（詳細で見る）`}
            aria-label={`${c.label} ${formatCount(n)}`}
            className="inline-flex items-center gap-0.5 rounded-md px-0.5 py-1 text-viscum-muted opacity-80 transition hover:bg-viscum-paper-2 hover:opacity-100"
          >
            <ProtocolMark id={c.id} className="h-5 w-5" />
            <span className="text-[12px] font-medium tabular-nums leading-none">
              {formatCount(n)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** @deprecated 分割後の互換。黄は FeedBookmarkButton、他は FeedAttitudeCounts */
export function FeedThumbReactions({
  workId,
  title,
  bookmarkBase = 0,
  greenBase = 0,
  blueBase = 0,
  redBase = 0,
}: {
  workId: string;
  title: string;
  bookmarkBase?: number;
  greenBase?: number;
  blueBase?: number;
  redBase?: number;
  sukiBase?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <FeedAttitudeCounts
        workId={workId}
        greenBase={greenBase}
        blueBase={blueBase}
        redBase={redBase}
      />
      <FeedBookmarkButton
        workId={workId}
        title={title}
        bookmarkBase={bookmarkBase}
      />
    </div>
  );
}
