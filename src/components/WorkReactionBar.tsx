"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCount } from "@/data/dummy-works";
import { hasReaction, toggleReaction } from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";

/**
 * 作品詳細の「気になる」のみ（ADR-036）。
 * 履歴は右上メニュー → 「気になる」（/dashboard/reactions）。
 */
export function WorkReactionBar({
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

  function onToggle() {
    const { on } = toggleReaction(workId, "bookmark", title);
    setBmOn(on);
    if (on) bumpLocalSeedStat(workId, "bookmarkCount");
  }

  const bmN = bookmarkBase + (bmOn ? 1 : 0);

  return (
    <div className="space-y-2 rounded-lg border border-viscum-line bg-white/50 px-3 py-3">
      <p className="text-[11px] leading-relaxed text-viscum-muted">
        <strong className="font-medium text-viscum-ink">気になる</strong>
        ＝あとで戻る保存（温度の1タップも兼ねる）。
        {workId.startsWith("local_")
          ? "この端末の件数です。"
          : "数字は他の人も含めた件数です。"}
        履歴は右上メニューの
        <Link
          href="/dashboard/reactions"
          className="font-medium text-viscum-brand underline-offset-2 hover:underline"
        >
          「気になる」
        </Link>
        で見られます。
      </p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={bmOn}
        className={`flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
          bmOn
            ? "border-viscum-brand bg-viscum-leaf-soft text-viscum-brand"
            : "border-viscum-line bg-viscum-paper text-viscum-ink hover:border-viscum-brand"
        }`}
      >
        <span>{bmOn ? "気になる済み" : "気になる"}</span>
        <span className="tabular-nums opacity-90">{formatCount(bmN)}</span>
      </button>
    </div>
  );
}
