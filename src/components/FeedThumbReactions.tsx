"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatCount } from "@/data/dummy-works";
import { hasReaction, toggleReaction } from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";
import { PROTOCOL_COLORS, type ProtocolColorId } from "@/lib/protocol-colors";

/**
 * フィード右下: プロトコル4色。
 * 🟡気になる＝既存 bookmark の件数・トグル（ADR-046）。
 * 他色は詳細でのコメント態度が集計されて流れてくる想定（いまはプレースホルダ）。
 */
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

  const counts: Record<ProtocolColorId, number> = {
    green: greenBase,
    blue: blueBase,
    yellow: bookmarkBase + (bmOn ? 1 : 0),
    red: redBase,
  };

  return (
    <div
      className="flex items-center gap-0.5"
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="反応の色"
    >
      {PROTOCOL_COLORS.map((c) => {
        const n = counts[c.id];
        const isYellow = c.id === "yellow";
        const label = isYellow
          ? bmOn
            ? `気になる済み · ${formatCount(n)}`
            : `気になる · ${formatCount(n)}`
          : `${c.label}（詳細のコメントから集計・準備中）`;

        if (isYellow) {
          return (
            <button
              key={c.id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={bmOn}
              onClick={onYellow}
              className={`inline-flex min-w-[1.75rem] flex-col items-center rounded-md px-0.5 py-0.5 transition ${
                bmOn
                  ? "bg-viscum-protocol-yellow-soft"
                  : "hover:bg-viscum-paper-2"
              }`}
            >
              <span className="text-[14px] leading-none" aria-hidden>
                {c.emoji}
              </span>
              <span
                className={`min-w-[1.25ch] text-[9px] font-medium tabular-nums leading-none ${
                  bmOn ? "text-viscum-ink" : "text-viscum-muted"
                }`}
              >
                {formatCount(n)}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={c.id}
            href={`/w/${workId}`}
            title={label}
            aria-label={label}
            className="inline-flex min-w-[1.75rem] flex-col items-center rounded-md px-0.5 py-0.5 text-viscum-muted opacity-70 transition hover:bg-viscum-paper-2 hover:opacity-100"
          >
            <span className="text-[14px] leading-none" aria-hidden>
              {c.emoji}
            </span>
            <span className="min-w-[1.25ch] text-[9px] font-medium tabular-nums leading-none">
              {formatCount(n)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
