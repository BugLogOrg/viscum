"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DUMMY_WORKS } from "@/data/dummy-works";
import { DEMO_FOLLOWING } from "@/data/demo-follows";
import { WorkFeedRow } from "@/components/WorkFeedRow";
import { AppShell } from "@/components/AppShell";
import { SiteHeader } from "@/components/SiteHeader";

type Filter = "all" | "open" | "follow";

function matchesQuery(
  w: (typeof DUMMY_WORKS)[number],
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [w.title, w.tagline, w.seeder, w.description, ...w.tags]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function FeedClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setSpecialty(searchParams.get("tag"));
    const feed = searchParams.get("feed");
    if (feed === "open" || feed === "follow" || feed === "all") {
      setFilter(feed);
    }
  }, [searchParams]);

  const selectTag = useCallback(
    (tag: string | null) => {
      setSpecialty(tag);
      const params = new URLSearchParams(searchParams.toString());
      if (tag) params.set("tag", tag);
      else params.delete("tag");
      const q = params.toString();
      router.replace(q ? `/?${q}` : "/");
    },
    [router, searchParams],
  );

  const followed = DUMMY_WORKS.filter((w) => {
    if (!DEMO_FOLLOWING.has(w.seeder.toLowerCase())) return false;
    if (!matchesQuery(w, query)) return false;
    if (specialty && !w.tags.includes(specialty)) return false;
    if (filter === "open") {
      return w.status === "open" || w.status === "pay_soon";
    }
    return true;
  });

  let rest: (typeof DUMMY_WORKS)[number][];
  if (filter === "follow") {
    rest = followed;
  } else if (specialty || query.trim()) {
    rest = DUMMY_WORKS.filter((w) => matchesQuery(w, query));
    if (specialty) {
      rest = rest.filter((w) => w.tags.includes(specialty));
    }
  } else {
    rest = [...DUMMY_WORKS];
  }

  if (filter === "open") {
    rest = rest.filter((w) => w.status === "open" || w.status === "pay_soon");
  }

  const openCount = DUMMY_WORKS.filter(
    (w) => w.status === "open" || w.status === "pay_soon",
  ).length;

  const title =
    filter === "open" ? "開催中" : filter === "follow" ? "フォロー中" : "すべて";

  return (
    <AppShell
      activeTag={specialty}
      onSelectTag={selectTag}
      feedFilter={filter}
      onFeedFilter={setFilter}
      openCount={openCount}
    >
      <SiteHeader hideOnMd />
      <div className="border-b border-viscum-line px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold text-viscum-ink">{title}</h1>
          {(specialty || query.trim()) && (
            <p className="truncate text-xs text-viscum-muted">
              {specialty ? `専門: ${specialty}` : ""}
              {specialty && query.trim() ? " · " : ""}
              {query.trim() ? `「${query.trim()}」` : ""}
            </p>
          )}
        </div>
        {filter === "open" && !specialty && !query.trim() && (
          <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
            コメントコンペ開催中。チップ付きで反応を募集しているシードです。
          </p>
        )}

        <label className="sr-only" htmlFor="feed-search">
          キーワード検索
        </label>
        <input
          id="feed-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトル・シーダー・タグ"
          className="mt-2 w-full rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-sm text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none focus:ring-1 focus:ring-viscum-brand"
        />

        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
          <button
            type="button"
            onClick={() => selectTag(null)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
              !specialty
                ? "bg-viscum-brand text-white"
                : "bg-viscum-paper-2 text-viscum-muted"
            }`}
          >
            すべて
          </button>
          {["アプリ", "小説", "動画", "デザイン", "ツール"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => selectTag(tag)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                specialty === tag
                  ? "bg-viscum-berry text-white"
                  : "bg-viscum-paper-2 text-viscum-muted"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filter === "follow" && !specialty && !query.trim() && (
        <p className="border-b border-viscum-line bg-viscum-leaf-soft/30 px-3 py-2 text-[12px] text-viscum-muted">
          フォローしたシーダーの作品（デモ・固定リスト）
        </p>
      )}

      {/* モバイル用フィルタ（デスクトップは左ナビ） */}
      <div className="flex items-center gap-2 border-b border-viscum-line px-3 py-1.5 md:hidden">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            filter === "all"
              ? "bg-viscum-brand text-white"
              : "bg-viscum-paper-2 text-viscum-muted"
          }`}
        >
          すべて
        </button>
        <button
          type="button"
          onClick={() => setFilter("follow")}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            filter === "follow"
              ? "bg-viscum-brand text-white"
              : "bg-viscum-paper-2 text-viscum-muted"
          }`}
        >
          フォロー中
        </button>
        <button
          type="button"
          onClick={() => setFilter("open")}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            filter === "open"
              ? "bg-viscum-berry text-white"
              : "bg-viscum-paper-2 text-viscum-muted"
          }`}
        >
          開催中 ({openCount})
        </button>
        <span className="ml-auto text-[10px] text-viscum-muted">
          {rest.length}件
        </span>
      </div>

      <div className="hidden items-center justify-end border-b border-viscum-line px-3 py-1.5 md:flex">
        <span className="text-[10px] text-viscum-muted">{rest.length}件</span>
      </div>

      <section
        aria-label="一覧"
        className="lg:grid lg:grid-cols-2 lg:divide-x lg:divide-viscum-line"
      >
        {rest.map((w) => (
          <WorkFeedRow
            key={w.id}
            work={w}
            className="lg:border-viscum-line"
          />
        ))}
        {rest.length === 0 && (
          <p className="col-span-full px-4 py-8 text-center text-sm text-viscum-muted">
            「{query.trim() || specialty || "条件"}」に合う作品がありません
          </p>
        )}
      </section>
    </AppShell>
  );
}
