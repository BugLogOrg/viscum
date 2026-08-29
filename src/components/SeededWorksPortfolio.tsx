"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkFeedRow } from "@/components/WorkFeedRow";
import {
  PortfolioPagerBar,
  PORTFOLIO_PAGE_SIZE,
  usePortfolioPage,
} from "@/components/PortfolioPager";
import type { Work } from "@/data/dummy-works";
import {
  isDirectRequestLane,
  isLocalSeedListed,
  readLocalSeeds,
  workFromLocalSeed,
} from "@/lib/local-seeds";

type Props = {
  handle: string;
  /** サーバ側デモ作品（初期表示） */
  initialWorks: Work[];
};

/**
 * 公開プロフィールの「シードした作品」。
 * TOP同様 lg 2列・10件ページ。直依頼レーン・下書きは載せない。
 */
export function SeededWorksPortfolio({ handle, initialWorks }: Props) {
  const [localWorks, setLocalWorks] = useState<Work[]>([]);

  useEffect(() => {
    const load = () => {
      const key = handle.replace(/^@/, "").trim().toLowerCase();
      return readLocalSeeds()
        .filter((s) => {
          const h = s.seederHandle.replace(/^@/, "").trim().toLowerCase();
          return h === key && isLocalSeedListed(s) && !isDirectRequestLane(s);
        })
        .map(workFromLocalSeed);
    };
    setLocalWorks(load());

    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== "viscum_local_seeds_v1") return;
      setLocalWorks(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [handle]);

  const works = useMemo(() => {
    const map = new Map<string, Work>();
    for (const w of initialWorks) map.set(w.id, w);
    for (const w of localWorks) map.set(w.id, w);
    return [...map.values()].sort((a, b) => a.hoursAgo - b.hoursAgo);
  }, [initialWorks, localWorks]);

  const { page, pageCount, pageItems, goToPage } = usePortfolioPage(
    works,
    PORTFOLIO_PAGE_SIZE,
  );

  return (
    <section className="border-b border-viscum-line">
      <p className="px-4 pt-4 text-[20px] font-bold text-viscum-ink">
        シードした作品 · {works.length}件
      </p>
      <p className="px-4 pt-1 text-[11px] leading-snug text-viscum-muted">
        棚に出した作品です（コンペ募集中・決済前も含む）。直依頼だけの作品や下書きはここには出ません。上の「払った件数」とは別の事実です。
      </p>
      {works.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-viscum-muted">
          まだシードした作品はありません。
        </p>
      ) : (
        <>
          <div className="mt-2 lg:grid lg:grid-cols-2 lg:divide-x lg:divide-viscum-line">
            {pageItems.map((w) => (
              <WorkFeedRow
                key={w.id}
                work={w}
                className="lg:border-viscum-line"
              />
            ))}
          </div>
          <PortfolioPagerBar
            page={page}
            pageCount={pageCount}
            onPrev={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
          />
        </>
      )}
    </section>
  );
}
