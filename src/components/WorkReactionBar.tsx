"use client";

import { useEffect, useState } from "react";
import {
  hasReaction,
  toggleReaction,
  type ReactionKind,
} from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";

/**
 * 作品詳細のスキ／気になる。
 * 自分の打刻は /me/reactions で一覧できる。
 */
export function WorkReactionBar({
  workId,
  title,
}: {
  workId: string;
  title: string;
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

  return (
    <div className="space-y-2 rounded-lg border border-viscum-line bg-white/50 px-3 py-3">
      <p className="text-[11px] leading-relaxed text-viscum-muted">
        <strong className="font-medium text-viscum-ink">スキ</strong>
        ＝いまの好意 ·{" "}
        <strong className="font-medium text-viscum-ink">気になる</strong>
        ＝あとで戻る（ブックマーク）。打刻はマイページの一覧で見られます。
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onToggle("suki")}
          aria-pressed={sukiOn}
          className={`flex-1 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
            sukiOn
              ? "border-viscum-berry bg-viscum-berry text-white"
              : "border-viscum-line bg-viscum-paper text-viscum-ink hover:border-viscum-berry"
          }`}
        >
          {sukiOn ? "スキ済み" : "スキ"}
        </button>
        <button
          type="button"
          onClick={() => onToggle("bookmark")}
          aria-pressed={bmOn}
          className={`flex-1 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
            bmOn
              ? "border-viscum-brand bg-viscum-leaf-soft text-viscum-brand"
              : "border-viscum-line bg-viscum-paper text-viscum-ink hover:border-viscum-brand"
          }`}
        >
          {bmOn ? "気になる済み" : "気になる"}
        </button>
      </div>
    </div>
  );
}
