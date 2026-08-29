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

function rankNewestWorks(works: Work[], limit = 5): Work[] {
  return works
    .slice()
    .sort((a, b) => a.hoursAgo - b.hoursAgo)
    .slice(0, limit);
}

/** 賛成(青)／止まれ(赤)の偏り。逆張り・応援向きの発見用 */
function rankSkewedWorks(
  works: Work[],
  opts?: { excludeId?: string; limit?: number },
): { work: Work; lean: "blue" | "red"; blue: number; red: number }[] {
  const limit = opts?.limit ?? 5;
  const scored = works
    .filter((w) => w.status === "open" && w.id !== opts?.excludeId)
    .map((w) => {
      const c = countCommentAttitudes(w.comments ?? []);
      const blue = c.blue;
      const red = c.red;
      const total = blue + red;
      if (total < 2) return null;
      const skew = Math.abs(blue - red) / total;
      if (skew < 0.35) return null; // 拮抗は除外
      const lean: "blue" | "red" = blue >= red ? "blue" : "red";
      const score = skew * Math.log(1 + total);
      return { work: w, lean, blue, red, score };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map(({ work, lean, blue, red }) => ({
    work,
    lean,
    blue,
    red,
  }));
}

function CompactWorkLink({
  work,
  skewHint,
}: {
  work: Work;
  skewHint?: { lean: "blue" | "red"; blue: number; red: number };
}) {
  const rx = getWorkReactionCounts(work);
  const countdown = formatClosesIn(work.closesInHours, work.status);
  return (
    <Link
      href={`/w/${work.id}`}
      className="block py-2 transition hover:bg-viscum-paper-2/80"
    >
      <div className="flex flex-wrap items-center gap-1.5">
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
            {skewHint.lean === "blue" ? "賛成寄り" : "止まれ寄り"} · 青
            {skewHint.blue}／赤{skewHint.red}
          </span>
        ) : null}
      </div>
      <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-viscum-ink">
        {work.title}
      </p>
      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-[11px] text-viscum-muted">
        <span>
          <SeederNameText
            handle={work.seeder}
            preferredName={work.seederAccountName}
          />
        </span>
        <span>気になる {formatCount(rx.bookmark)}</span>
        <span>コメント {formatCount(work.comments?.length ?? 0)}</span>
      </p>
    </Link>
  );
}

/**
 * 発見レール: 注目／新着／賛否の偏り。
 * TOP 右カラム・詳細右カラムで共用。一覧の下だと埋もれるので sticky 右へ。
 */
export function FeedShelfCorners({
  works: worksProp,
  excludeWorkId,
  className = "",
}: {
  /** 渡されればそれ（TOPの Neon 合流棚）。無ければ端末棚を読む */
  works?: Work[];
  excludeWorkId?: string;
  className?: string;
}) {
  const [localShelf, setLocalShelf] = useState<Work[]>(() =>
    typeof window === "undefined" ? [] : loadClientShelfWorks(),
  );

  useEffect(() => {
    if (worksProp) return;
    const refresh = () => setLocalShelf(loadClientShelfWorks());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [worksProp]);

  const works = worksProp ?? localShelf;

  const hot = useMemo(
    () => rankHotOpenWorks(works, { excludeId: excludeWorkId, limit: 5 }),
    [works, excludeWorkId],
  );
  const newest = useMemo(
    () =>
      rankNewestWorks(
        works.filter((w) => w.id !== excludeWorkId),
        5,
      ),
    [works, excludeWorkId],
  );
  const skewed = useMemo(
    () => rankSkewedWorks(works, { excludeId: excludeWorkId, limit: 5 }),
    [works, excludeWorkId],
  );

  if (hot.length === 0 && newest.length === 0 && skewed.length === 0) {
    return null;
  }

  return (
    <aside
      className={`border-t border-viscum-line bg-viscum-paper-2/30 xl:sticky xl:top-12 xl:max-h-[calc(100dvh-3rem)] xl:w-80 xl:shrink-0 xl:self-start xl:overflow-y-auto xl:border-l xl:border-t-0 ${className}`}
      aria-label="発見"
    >
      {hot.length > 0 ? (
        <section className="border-b border-viscum-line px-3 py-3" aria-label="注目の開催中">
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
          <p className="mt-1 text-[11px] leading-snug text-viscum-muted">
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
      ) : null}

      {newest.length > 0 ? (
        <section className="border-b border-viscum-line px-3 py-3" aria-label="新着">
          <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
            新着
          </h2>
          <p className="mt-1 text-[11px] leading-snug text-viscum-muted">
            最近シードされた作品
          </p>
          <ul className="mt-1.5 divide-y divide-viscum-line">
            {newest.map((w) => (
              <li key={w.id}>
                <CompactWorkLink work={w} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {skewed.length > 0 ? (
        <section className="px-3 py-3" aria-label="賛否が偏っている">
          <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
            賛否が偏っている
          </h2>
          <p className="mt-1 text-[11px] leading-snug text-viscum-muted">
            賛成か止まれに寄っている開催中。逆張りコメントの余地
          </p>
          <ul className="mt-1.5 divide-y divide-viscum-line">
            {skewed.map(({ work, lean, blue, red }) => (
              <li key={work.id}>
                <CompactWorkLink
                  work={work}
                  skewHint={{ lean, blue, red }}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
