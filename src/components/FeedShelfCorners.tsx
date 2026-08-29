"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Work } from "@/data/dummy-works";
import {
  formatClosesIn,
  formatCount,
  getWorkReactionCounts,
  planBadgeLabel,
} from "@/data/dummy-works";
import { SeederNameText } from "@/components/SeederNameText";
import { StatusBadge } from "@/components/StatusBadge";
import {
  loadClientShelfWorks,
  rankHotOpenWorks,
} from "@/lib/hot-open-ranking";
import { countCommentAttitudes } from "@/lib/protocol-colors";

/** 賛成(青)／止まれ(赤)の偏り＝偏差。表示は別／賛／止で合計を合わせる */
function rankSkewedWorks(
  works: Work[],
  opts?: { excludeId?: string; limit?: number },
): {
  work: Work;
  lean: "blue" | "red";
  green: number;
  blue: number;
  red: number;
}[] {
  const limit = opts?.limit ?? 5;
  const scored = works
    .filter((w) => w.status === "open" && w.id !== opts?.excludeId)
    .map((w) => {
      const c = countCommentAttitudes(w.comments ?? []);
      const green = c.green;
      const blue = c.blue;
      const red = c.red;
      const duel = blue + red;
      if (duel < 2) return null;
      const skew = Math.abs(blue - red) / duel;
      if (skew < 0.25) return null;
      const lean: "blue" | "red" = blue >= red ? "blue" : "red";
      const score = skew * Math.log(1 + duel);
      return { work: w, lean, green, blue, red, score };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map(({ work, lean, green, blue, red }) => ({
    work,
    lean,
    green,
    blue,
    red,
  }));
}

function CompactWorkLink({
  work,
  skewHint,
}: {
  work: Work;
  skewHint?: {
    lean: "blue" | "red";
    green: number;
    blue: number;
    red: number;
  };
}) {
  const rx = getWorkReactionCounts(work);
  const countdown = formatClosesIn(work.closesInHours, work.status);
  const commentN = work.comments?.length ?? 0;
  return (
    <Link
      href={`/w/${work.id}`}
      className="block min-w-0 py-2 transition hover:bg-viscum-paper-2/80"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {work.status === "open" || work.status === "pay_soon" ? (
          <StatusBadge
            status={work.status}
            prizeYen={work.prizeYen}
            paymentsDone={work.paymentsDone}
            planLabel={planBadgeLabel(work.plan)}
            className="shrink-0"
          />
        ) : null}
        {countdown ? (
          <span className="text-[11px] font-medium text-viscum-berry-deep">
            {countdown}
          </span>
        ) : null}
        {skewHint ? (
          <span
            className={`text-[10px] font-medium ${
              skewHint.lean === "blue"
                ? "text-viscum-protocol-blue"
                : "text-viscum-protocol-red"
            }`}
          >
            {skewHint.lean === "blue" ? "賛成寄り" : "止まれ寄り"} · 別
            {skewHint.green}／賛{skewHint.blue}／止{skewHint.red}
          </span>
        ) : null}
      </div>
      <p className="mt-1 line-clamp-2 break-words text-[13px] font-medium leading-snug text-viscum-ink">
        {work.title}
      </p>
      <p className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 text-[11px] text-viscum-muted">
        <span>
          <SeederNameText
            handle={work.seeder}
            preferredName={work.seederAccountName}
          />
        </span>
        <span>気になる {formatCount(rx.bookmark)}</span>
        <span>コメント {formatCount(commentN)}</span>
      </p>
    </Link>
  );
}

function HotSection({
  hot,
  className = "",
}: {
  hot: Work[];
  className?: string;
}) {
  if (hot.length === 0) return null;
  return (
    <section className={className} aria-label="注目の開催中">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
          注目の開催中
        </h2>
        <Link
          href="/?feed=open"
          className="shrink-0 text-[11px] text-viscum-brand underline-offset-2 hover:underline"
        >
          すべて
        </Link>
      </div>
      <p className="mt-1 text-[11px] leading-snug break-words text-viscum-muted">
        反応が集まっている開催中
      </p>
      <ul className="mt-1.5 divide-y divide-viscum-line">
        {hot.map((w) => (
          <li key={w.id}>
            <CompactWorkLink work={w} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkewSection({
  skewed,
  className = "",
}: {
  skewed: ReturnType<typeof rankSkewedWorks>;
  className?: string;
}) {
  if (skewed.length === 0) return null;
  return (
    <section className={className} aria-label="偏差">
      <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
        偏差
      </h2>
      <p className="mt-1 text-[11px] leading-snug break-words text-viscum-muted">
        賛成／止まれに寄っている開催中。逆張りの余地
      </p>
      <ul className="mt-1.5 divide-y divide-viscum-line">
        {skewed.map(({ work, lean, green, blue, red }) => (
          <li key={work.id}>
            <CompactWorkLink
              work={work}
              skewHint={{ lean, green, blue, red }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 発見コーナー（注目＋偏差）。
 * - bottom: TOP用。一覧の下に横2枠（右カラムにしない＝息苦しさ回避）
 * - sideDuo: 詳細用。右に注目｜偏差の二段カラム
 */
export function FeedShelfCorners({
  works: worksProp,
  excludeWorkId,
  layout = "bottom",
  className = "",
}: {
  works?: Work[];
  excludeWorkId?: string;
  layout?: "bottom" | "sideDuo";
  className?: string;
}) {
  const [localShelf, setLocalShelf] = useState<Work[]>(() =>
    typeof window === "undefined" ? [] : loadClientShelfWorks(),
  );

  useEffect(() => {
    if (worksProp) return;
    let cancelled = false;
    const refresh = () => {
      const local = loadClientShelfWorks();
      void fetch("/api/works?listed=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { works?: Work[] } | null) => {
          if (cancelled) return;
          const neon = data?.works ?? [];
          const neonIds = new Set(neon.map((w) => w.id));
          const rest = local.filter((w) => !neonIds.has(w.id));
          setLocalShelf([...neon, ...rest]);
        })
        .catch(() => {
          if (!cancelled) setLocalShelf(local);
        });
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [worksProp]);

  const works = worksProp ?? localShelf;

  const hot = useMemo(
    () => rankHotOpenWorks(works, { excludeId: excludeWorkId, limit: 5 }),
    [works, excludeWorkId],
  );
  // 偏差は「いま見ている作品」も候補に残す（除外するとTOPと件数がズレる）
  // ただしリスト先頭で自分自身は出さない
  const skewed = useMemo(() => {
    const all = rankSkewedWorks(works, { limit: 6 });
    if (!excludeWorkId) return all.slice(0, 5);
    const without = all.filter((x) => x.work.id !== excludeWorkId);
    return without.slice(0, 5);
  }, [works, excludeWorkId]);

  if (hot.length === 0 && skewed.length === 0) return null;

  if (layout === "sideDuo") {
    return (
      <aside
        className={`flex w-full min-w-0 flex-col overflow-hidden border-t border-viscum-line bg-viscum-paper-2/30 xl:w-auto xl:flex-row xl:self-start xl:border-l xl:border-t-0 xl:pr-4 ${className}`}
        aria-label="発見"
      >
        <div className="min-w-0 xl:sticky xl:top-12 xl:max-h-[calc(100dvh-3rem)] xl:w-72 xl:shrink-0 xl:overflow-y-auto xl:border-r xl:border-viscum-line">
          <HotSection hot={hot} className="min-w-0 px-3 py-3" />
        </div>
        <div className="min-w-0 border-t border-viscum-line xl:sticky xl:top-12 xl:max-h-[calc(100dvh-3rem)] xl:w-72 xl:shrink-0 xl:overflow-y-auto xl:border-t-0">
          <SkewSection skewed={skewed} className="min-w-0 px-3 py-3" />
        </div>
      </aside>
    );
  }

  // TOP: 一覧の下・横2枠
  return (
    <aside
      className={`min-w-0 overflow-hidden border-t border-viscum-line bg-viscum-paper-2/25 ${className}`}
      aria-label="発見"
    >
      <div className="grid min-w-0 gap-0 md:grid-cols-2 md:divide-x md:divide-viscum-line">
        <HotSection
          hot={hot}
          className="min-w-0 border-b border-viscum-line px-4 py-4 md:border-b-0"
        />
        <SkewSection skewed={skewed} className="min-w-0 px-4 py-4" />
      </div>
    </aside>
  );
}
