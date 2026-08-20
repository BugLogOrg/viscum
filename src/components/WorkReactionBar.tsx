"use client";

import { useEffect, useState } from "react";
import { formatCount } from "@/data/dummy-works";
import {
  hasReaction,
  toggleReaction,
  type ReactionKind,
} from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";

/**
 * 作品詳細のスキ／気になる。
 * 自分の打刻は /dashboard/reactions で一覧できる。
 */
export function WorkReactionBar({
  workId,
  title,
  sukiBase = 0,
  bookmarkBase = 0,
}: {
  workId: string;
  title: string;
  sukiBase?: number;
  bookmarkBase?: number;
}) {
  const [sukiOn, setSukiOn] = useState(false);
  const [bmOn, setBmOn] = useState(false);

  useEffect(() => {
    setSukiOn(hasReaction(workId, "suki"));
    setBmOn(hasReaction(workId, "bookmark"));
  }, [workId]);

  function onToggle(kind: ReactionKind) {
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
    <div className="space-y-2 rounded-lg border border-viscum-line bg-white/50 px-3 py-3">
      <p className="text-[11px] leading-relaxed text-viscum-muted">
        <strong className="font-medium text-viscum-ink">スキ</strong>
        ＝いまの好意 ·{" "}
        <strong className="font-medium text-viscum-ink">気になる</strong>
        ＝あとで戻る（ブックマーク）。数字は他の人も含めた件数です。打刻はマイページの一覧で見られます。
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onToggle("suki")}
          aria-pressed={sukiOn}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
            sukiOn
              ? "border-viscum-berry bg-viscum-berry text-white"
              : "border-viscum-line bg-viscum-paper text-viscum-ink hover:border-viscum-berry"
          }`}
        >
          <span>{sukiOn ? "スキ済み" : "スキ"}</span>
          <span className="tabular-nums opacity-90">{formatCount(sukiN)}</span>
        </button>
        <button
          type="button"
          onClick={() => onToggle("bookmark")}
          aria-pressed={bmOn}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
            bmOn
              ? "border-viscum-brand bg-viscum-leaf-soft text-viscum-brand"
              : "border-viscum-line bg-viscum-paper text-viscum-ink hover:border-viscum-brand"
          }`}
        >
          <span>{bmOn ? "気になる済み" : "気になる"}</span>
          <span className="tabular-nums opacity-90">{formatCount(bmN)}</span>
        </button>
      </div>
    </div>
  );
}
