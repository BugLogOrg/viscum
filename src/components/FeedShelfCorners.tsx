"use client";

import Link from "next/link";
import type { Work } from "@/data/dummy-works";
import {
  formatClosesIn,
  formatCount,
  getWorkReactionCounts,
  planBadgeLabel,
} from "@/data/dummy-works";
import { SeederNameText } from "@/components/SeederNameText";
import { StatusBadge } from "@/components/StatusBadge";
import { rankHotOpenWorks } from "@/lib/hot-open-ranking";

function rankNewestWorks(works: Work[], limit = 5): Work[] {
  return works
    .slice()
    .sort((a, b) => a.hoursAgo - b.hoursAgo)
    .slice(0, limit);
}

function CompactWorkLink({ work }: { work: Work }) {
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
 * TOP Phase 2: シード一覧の下に置く発見コーナー。
 * 中身が薄くても骨格を先に置く（後から中身が増える前提）。
 */
export function FeedShelfCorners({ works }: { works: Work[] }) {
  const hot = rankHotOpenWorks(works, { limit: 5 });
  const newest = rankNewestWorks(works, 5);

  if (hot.length === 0 && newest.length === 0) return null;

  return (
    <div className="border-t border-viscum-line bg-viscum-paper-2/25">
      <div className="mx-auto grid max-w-7xl gap-0 md:grid-cols-2 md:divide-x md:divide-viscum-line">
        {hot.length > 0 ? (
          <section className="px-4 py-4" aria-label="注目の開催中">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
                注目の開催中
              </h2>
              <Link
                href="/?feed=open"
                className="shrink-0 text-[11px] text-viscum-brand underline-offset-2 hover:underline"
              >
                すべて見る
              </Link>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-viscum-muted">
              反応が集まっている開催中（仮の並び）
            </p>
            <ul className="mt-2 divide-y divide-viscum-line">
              {hot.map((w) => (
                <li key={w.id}>
                  <CompactWorkLink work={w} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {newest.length > 0 ? (
          <section
            className={`px-4 py-4 ${hot.length === 0 ? "md:col-span-2" : ""}`}
            aria-label="新着"
          >
            <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
              新着
            </h2>
            <p className="mt-1 text-[11px] leading-snug text-viscum-muted">
              最近シードされた作品
            </p>
            <ul className="mt-2 divide-y divide-viscum-line">
              {newest.map((w) => (
                <li key={w.id}>
                  <CompactWorkLink work={w} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
