"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;

/** プロフィール棚のページング（TOP同様2列の親で使う） */
export function usePortfolioPage<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    pageCount,
    pageItems,
    total: items.length,
    goToPage: (n: number) => setPage(Math.max(1, Math.min(n, pageCount))),
    pageSize,
  };
}

export function PortfolioPagerBar({
  page,
  pageCount,
  onPrev,
  onNext,
}: {
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 border-t border-viscum-line px-4 py-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrev}
        className="rounded-md border border-viscum-line px-3 py-1.5 text-[13px] text-viscum-ink disabled:opacity-40"
      >
        前へ
      </button>
      <span className="text-[13px] tabular-nums text-viscum-muted">
        {page} / {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={onNext}
        className="rounded-md border border-viscum-line px-3 py-1.5 text-[13px] text-viscum-ink disabled:opacity-40"
      >
        次へ
      </button>
    </div>
  );
}

export const PORTFOLIO_PAGE_SIZE = DEFAULT_PAGE_SIZE;
