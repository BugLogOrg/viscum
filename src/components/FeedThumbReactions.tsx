"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatCount } from "@/data/dummy-works";
import { hasReaction, toggleReaction } from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";
import { PROTOCOL_COLORS, type ProtocolColorId } from "@/lib/protocol-colors";
import { ProtocolDot } from "@/components/ProtocolDot";

/**
 * フィード右下: プロトコル4色（アース試し）。
 * 🟡気になる＝bookmark。他は詳細コメント集計のプレースホルダ。
 * 件数は色丸の右。形はベタ塗り。
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
      className="flex items-center gap-1"
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
          : `${c.label}（準備中）`;

        const inner = (
          <>
            <ProtocolDot id={c.id} className="h-2.5 w-2.5" />
            <span
              className={`text-[11px] font-medium tabular-nums leading-none ${
                isYellow && bmOn ? "text-viscum-ink" : "text-viscum-muted"
              }`}
            >
              {formatCount(n)}
            </span>
          </>
        );

        if (isYellow) {
          return (
            <button
              key={c.id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={bmOn}
              onClick={onYellow}
              className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition ${
                bmOn
                  ? "bg-viscum-protocol-yellow-soft"
                  : "hover:bg-viscum-paper-2"
              }`}
            >
              {inner}
            </button>
          );
        }

        return (
          <Link
            key={c.id}
            href={`/w/${workId}`}
            title={label}
            aria-label={label}
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 opacity-80 transition hover:bg-viscum-paper-2 hover:opacity-100"
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
