"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatCount } from "@/data/dummy-works";
import { readLocalComments } from "@/lib/local-comments";
import { hasReaction, toggleReaction } from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";
import {
  COMMENT_ATTITUDES,
  countCommentAttitudes,
  type CommentAttitudeId,
} from "@/lib/protocol-colors";
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
 * フィードでは押せない態度選択ではなく、コメント態度の集計。
 */
export function FeedAttitudeCounts({
  workId,
  comments = [],
}: {
  workId: string;
  comments?: { attitude?: string }[];
}) {
  const [localExtra, setLocalExtra] = useState<{ attitude?: string }[]>([]);

  useEffect(() => {
    setLocalExtra(readLocalComments(workId));
  }, [workId]);

  const counts = useMemo(
    () => countCommentAttitudes([...comments, ...localExtra]),
    [comments, localExtra],
  );

  return (
    <div
      className="flex items-center gap-0.5"
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="コメント態度の件数"
    >
      {COMMENT_ATTITUDES.map((c) => {
        const id = c.id as CommentAttitudeId;
        const n = counts[id];
        return (
          <Link
            key={id}
            href={`/w/${workId}`}
            title={`${c.label}：${c.attitude}`}
            aria-label={`${c.label} ${formatCount(n)}`}
            className="inline-flex -translate-y-px items-center gap-0.5 rounded-md px-0.5 py-0.5 text-viscum-muted opacity-80 transition hover:bg-viscum-paper-2 hover:opacity-100"
          >
            <ProtocolMark id={id} className="h-5 w-5" />
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
  comments = [],
}: {
  workId: string;
  title: string;
  bookmarkBase?: number;
  comments?: { attitude?: string }[];
  greenBase?: number;
  blueBase?: number;
  redBase?: number;
  sukiBase?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <FeedAttitudeCounts workId={workId} comments={comments} />
      <FeedBookmarkButton
        workId={workId}
        title={title}
        bookmarkBase={bookmarkBase}
      />
    </div>
  );
}
