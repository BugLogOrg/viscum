"use client";

import { useEffect, useState } from "react";
import type { Work } from "@/data/dummy-works";
import { formatCount } from "@/data/dummy-works";
import { buildWorkShareText } from "@/lib/work-share-text";
import { isDirectRequestLane } from "@/lib/local-seeds";
import { hasReaction, toggleReaction } from "@/lib/local-reactions";
import { bumpLocalSeedStat } from "@/lib/local-seeds";
import { ProtocolMark } from "@/components/ProtocolMark";

type Variant = "icons" | "row";

/**
 * 気になる＋共有。詳細では上（icons）とコメント直前（row）の二段。
 */
export function WorkDetailActionRow({
  work,
  bookmarkBase = 0,
  isDraft = false,
  variant,
}: {
  work: Work;
  bookmarkBase?: number;
  isDraft?: boolean;
  variant: Variant;
}) {
  const [bmOn, setBmOn] = useState(false);
  const [origin, setOrigin] = useState("");
  const [shareFlash, setShareFlash] = useState<string | null>(null);

  useEffect(() => {
    setBmOn(hasReaction(work.id, "bookmark"));
  }, [work.id]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const showShare =
    !isDraft && !isDirectRequestLane({ id: work.id, lane: undefined });

  function onToggleBm() {
    const { on } = toggleReaction(work.id, "bookmark", work.title);
    setBmOn(on);
    if (on) bumpLocalSeedStat(work.id, "bookmarkCount");
  }

  async function onShare() {
    if (!origin) return;
    const text = buildWorkShareText(work, origin)?.trim();
    if (!text) {
      setShareFlash("文がありません");
      window.setTimeout(() => setShareFlash(null), 2000);
      return;
    }
    try {
      await navigator.clipboard?.writeText(text);
      setShareFlash("コピーしました");
    } catch {
      setShareFlash("失敗");
    }
    window.setTimeout(() => setShareFlash(null), 2000);
  }

  const bmN = bookmarkBase + (bmOn ? 1 : 0);
  const icons = variant === "icons";

  const bmBtn = (
    <button
      type="button"
      onClick={onToggleBm}
      aria-pressed={bmOn}
      title={bmOn ? "気になる済み" : "気になる（あとで戻る）"}
      aria-label={
        bmOn
          ? `気になる済み ${formatCount(bmN)}`
          : `気になる ${formatCount(bmN)}`
      }
      className={`inline-flex items-center gap-1.5 rounded-md transition ${
        icons
          ? `px-2 py-1.5 ${
              bmOn
                ? "bg-viscum-protocol-yellow-soft text-viscum-ink"
                : "text-viscum-muted hover:bg-viscum-paper-2 hover:text-viscum-ink"
            }`
          : `border px-3 py-2 text-[13px] font-medium ${
              bmOn
                ? "border-[color:var(--viscum-protocol-yellow)] bg-viscum-protocol-yellow-soft text-viscum-ink"
                : "border-viscum-line bg-viscum-paper text-viscum-ink hover:border-[color:var(--viscum-protocol-yellow)]"
            }`
      }`}
    >
      <ProtocolMark id="yellow" filled={bmOn} className="h-6 w-6 shrink-0" />
      {!icons ? (
        <span>{bmOn ? "気になる済み" : "気になる"}</span>
      ) : null}
      <span
        className={`tabular-nums ${icons ? "text-[13px] font-medium" : "opacity-90"}`}
      >
        {formatCount(bmN)}
      </span>
    </button>
  );

  const shareBtn = showShare ? (
    <button
      type="button"
      onClick={() => void onShare()}
      disabled={!origin}
      title="告知文をコピー"
      aria-label={shareFlash ?? "告知文をコピー"}
      className={`inline-flex items-center gap-1.5 rounded-md transition ${
        icons
          ? "px-2 py-1.5 text-viscum-muted hover:bg-viscum-paper-2 hover:text-viscum-ink"
          : "border border-viscum-line bg-viscum-paper px-3 py-2 text-[13px] font-medium text-viscum-ink hover:border-viscum-brand hover:text-viscum-brand"
      }`}
    >
      <ShareGlyph className="h-5 w-5 shrink-0" />
      {!icons ? <span>{shareFlash ?? "共有（コピー）"}</span> : null}
      {icons && shareFlash ? (
        <span className="text-[11px] font-medium text-viscum-brand">
          {shareFlash}
        </span>
      ) : null}
    </button>
  ) : null;

  if (icons) {
    return (
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="反応と共有">
        {bmBtn}
        {shareBtn}
      </div>
    );
  }

  return (
    <div className="space-y-1.5" role="group" aria-label="反応と共有">
      <p className="text-[11px] text-viscum-muted">
        気になる＝あとで戻る。共有＝告知文をコピー。
      </p>
      <div className="flex flex-wrap gap-2">
        {bmBtn}
        {shareBtn}
      </div>
    </div>
  );
}

function ShareGlyph({ className }: { className?: string }) {
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
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.4 13.2 15.6 17.1M15.6 6.9 8.4 10.8" />
    </svg>
  );
}
