"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DUMMY_WORKS, type Work } from "@/data/dummy-works";
import {
  FOLLOWS_UPDATED,
  absorbServerFollowing,
  clearRememberedViewer,
  listFollowing,
  mergeHandleLists,
  readRememberedViewer,
  rememberViewer,
} from "@/lib/local-follows";
import {
  getDemoSeederProfile,
  isDemoSeederHandle,
  searchDemoUsers,
  THUMB_TONE_CLASS,
  type SuggestedSeeder,
} from "@/data/suggested-seeders";
import { fetchRemoteProfile } from "@/lib/local-profile";
import { loadClientShelfWorks } from "@/lib/hot-open-ranking";
import { buildWorkShareText, buildXIntentUrl } from "@/lib/work-share-text";
import {
  clearJustPublished,
  markJustPublished,
  peekJustPublished,
} from "@/lib/just-published";
import { WorkFeedRow } from "@/components/WorkFeedRow";
import { AppShell } from "@/components/AppShell";
import { SiteHeader } from "@/components/SiteHeader";
import { SuggestFollows } from "@/components/SuggestFollows";
import { FollowButton } from "@/components/FollowButton";
import { DemoBadge } from "@/components/DemoBadge";
import { FeedShelfCorners } from "@/components/FeedShelfCorners";

type Filter = "all" | "open" | "follow";

/** TOP一覧の1ページ件数（雑誌型：本編を短くして下の発見へ） */
const FEED_PAGE_SIZE = 16;

function mergeShelf(neon: Work[], localShelf: Work[]): Work[] {
  const neonIds = new Set(neon.map((w) => w.id));
  const rest = localShelf.filter((w) => !neonIds.has(w.id));
  return [...neon, ...rest];
}

function matchesQuery(w: Work, q: string): boolean {
  const raw = q.trim();
  if (!raw) return true;
  const needle = raw.toLowerCase().replace(/^@/, "");
  // 作品URLやUUIDを貼ったときもヒットさせる
  const idFromUrl = raw.match(
    /\/w\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  )?.[1];
  if (idFromUrl && w.id.toLowerCase() === idFromUrl.toLowerCase()) return true;
  if (w.id.toLowerCase() === needle) return true;
  const demo = getDemoSeederProfile(w.seeder);
  const hay = [
    w.title,
    w.tagline,
    w.seeder,
    w.seederAccountName ?? "",
    demo?.displayName ?? "",
    w.description,
    w.focusNote ?? "",
    ...w.tags,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

function initialFilter(searchParams: URLSearchParams): Filter {
  const feed = searchParams.get("feed");
  if (feed === "open" || feed === "follow" || feed === "all") return feed;
  return "all";
}

export function FeedClient({
  initialNeonWorks = [],
}: {
  initialNeonWorks?: Work[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const sessionHandle = session?.user?.handle?.trim() || "";
  const [filter, setFilter] = useState<Filter>(() =>
    initialFilter(searchParams),
  );
  const [specialty, setSpecialty] = useState<string | null>(() =>
    searchParams.get("tag"),
  );
  const [query, setQuery] = useState("");
  const [viewerHandle, setViewerHandle] = useState("");
  const [followingHandles, setFollowingHandles] = useState<string[]>([]);
  const [remotePeople, setRemotePeople] = useState<SuggestedSeeder[]>([]);
  const [shelf, setShelf] = useState<Work[]>(() =>
    mergeShelf(initialNeonWorks, [...DUMMY_WORKS]),
  );
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    // 旧 ?published= 互換 → sessionStorage へ移して URL から剥がす
    const fromUrl = searchParams.get("published")?.trim() || null;
    if (fromUrl) {
      markJustPublished(fromUrl);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("published");
      const q = params.toString();
      router.replace(q ? `/?${q}` : "/", { scroll: false });
    }
    const flash = peekJustPublished();
    if (flash) setPublishedId(flash);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時＋旧URL移行のみ
  }, [searchParams.get("published")]);

  useEffect(() => {
    const refresh = () => {
      const localShelf = loadClientShelfWorks();
      void fetch("/api/works?listed=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { works?: Work[] } | null) => {
          const neon = data?.works ?? initialNeonWorks;
          setShelf(mergeShelf(neon, localShelf));
        })
        .catch(() => setShelf(mergeShelf(initialNeonWorks, localShelf)));
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [publishedId, initialNeonWorks]);

  useEffect(() => {
    setSpecialty(searchParams.get("tag"));
    const feed = searchParams.get("feed");
    if (feed === "open" || feed === "follow" || feed === "all") {
      setFilter(feed);
    }
  }, [searchParams]);

  useLayoutEffect(() => {
    if (sessionHandle) {
      rememberViewer(sessionHandle);
      setViewerHandle(sessionHandle);
      return;
    }
    if (status === "loading") {
      const remembered = readRememberedViewer();
      if (remembered) setViewerHandle(remembered);
      return;
    }
    clearRememberedViewer();
    setViewerHandle("");
  }, [sessionHandle, status]);

  useEffect(() => {
    let remote: string[] = [];
    const sync = () => {
      setFollowingHandles(
        viewerHandle
          ? mergeHandleLists(listFollowing(viewerHandle), remote)
          : [],
      );
    };
    sync();
    window.addEventListener(FOLLOWS_UPDATED, sync);
    window.addEventListener("storage", sync);

    let cancelled = false;
    if (viewerHandle) {
      void fetch("/api/follows?mine=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { following?: string[] } | null) => {
          if (cancelled || !data?.following) return;
          remote = data.following;
          absorbServerFollowing(viewerHandle, remote);
          sync();
        })
        .catch(() => {
          /* 端末グラフのみ */
        });
    }

    return () => {
      cancelled = true;
      window.removeEventListener(FOLLOWS_UPDATED, sync);
      window.removeEventListener("storage", sync);
    };
  }, [viewerHandle]);

  useEffect(() => {
    const needle = query.trim().toLowerCase().replace(/^@/, "");
    if (!needle || needle.length < 2) {
      setRemotePeople([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const remote = await fetchRemoteProfile(needle);
      if (cancelled || !remote?.handle) {
        if (!cancelled) setRemotePeople([]);
        return;
      }
      const key = remote.handle.toLowerCase();
      const demo = getDemoSeederProfile(key);
      const shelfCount = shelf.filter(
        (w) => w.seeder.toLowerCase() === key,
      ).length;
      setRemotePeople([
        {
          handle: key,
          displayName: remote.accountName?.trim() || demo?.displayName || key,
          bio: remote.bio?.trim() || demo?.bio || "",
          thumbTone: demo?.thumbTone ?? "berry",
          glyph:
            demo?.glyph ??
            (remote.accountName?.trim() || key).slice(0, 1).toUpperCase(),
          workCount: shelfCount,
          imageUrl: remote.image ?? null,
        },
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, [query, shelf]);

  const myHandle = viewerHandle;
  const sessionPending = status === "loading" && !myHandle;
  const selectTag = useCallback(
    (tag: string | null) => {
      setSpecialty(tag);
      if (tag === null) {
        setQuery("");
        setPublishedId(null);
        clearJustPublished();
      }
      const params = new URLSearchParams(searchParams.toString());
      if (tag) params.set("tag", tag);
      else {
        params.delete("tag");
        params.delete("published");
      }
      params.delete("page");
      const q = params.toString();
      router.replace(q ? `/?${q}` : "/");
    },
    [router, searchParams],
  );

  const setFeedFilter = useCallback(
    (f: Filter) => {
      setFilter(f);
      if (f === "all") setQuery("");
      const params = new URLSearchParams(searchParams.toString());
      if (f === "all") params.delete("feed");
      else params.set("feed", f);
      params.delete("page");
      const q = params.toString();
      router.replace(q ? `/?${q}` : "/");
    },
    [router, searchParams],
  );

  const clearSearch = useCallback(() => setQuery(""), []);

  const goHomeFeed = useCallback(() => {
    setFilter("all");
    setQuery("");
    setSpecialty(null);
    setPublishedId(null);
    clearJustPublished();
    router.replace("/");
  }, [router]);

  const followSet = new Set(followingHandles);

  const followed = shelf.filter((w) => {
    if (!followSet.has(w.seeder.toLowerCase())) return false;
    if (!matchesQuery(w, query)) return false;
    if (specialty && !w.tags.includes(specialty)) return false;
    if (filter === "open") {
      return w.status === "open" || w.status === "pay_soon";
    }
    return true;
  });

  let rest: Work[];
  if (filter === "follow") {
    rest = followed;
  } else if (specialty || query.trim()) {
    rest = shelf.filter((w) => matchesQuery(w, query));
    if (specialty) {
      rest = rest.filter((w) => w.tags.includes(specialty));
    }
  } else {
    rest = [...shelf];
  }

  if (filter === "open") {
    rest = rest.filter((w) => w.status === "open" || w.status === "pay_soon");
  }

  const totalCount = rest.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / FEED_PAGE_SIZE));
  const pageRaw = Number.parseInt(searchParams.get("page") || "1", 10);
  const page =
    Number.isFinite(pageRaw) && pageRaw > 0
      ? Math.min(pageRaw, pageCount)
      : 1;
  const pageStart = (page - 1) * FEED_PAGE_SIZE;
  const pageItems = rest.slice(pageStart, pageStart + FEED_PAGE_SIZE);

  function goToPage(next: number) {
    const p = Math.max(1, Math.min(next, pageCount));
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const q = params.toString();
    router.replace(q ? `/?${q}` : "/", { scroll: true });
  }

  const openCount = shelf.filter(
    (w) => w.status === "open" || w.status === "pay_soon",
  ).length;

  /** Phase 2 最小: 入口一文はホーム（すべて・濾しなし）だけ */
  const showEntranceLine =
    filter === "all" && !specialty && !query.trim();
  const entranceLine = showEntranceLine
    ? "作ったものに、リアルな反応を。"
    : null;

  const contextCrumbs: string[] = [
    filter === "follow"
      ? sessionPending
        ? "フォロー中を読み込み中"
        : myHandle
          ? followingHandles.length > 0
            ? "フォローしたユーザーの作品"
            : "まだ誰もフォローしていません"
          : "ログインするとフォロー中が表示されます"
      : filter === "open"
        ? "VISCUM内コンペ開催中 · 反応を募集"
        : "反応を募集中",
  ];
  if (specialty) contextCrumbs.push(specialty);
  if (query.trim()) contextCrumbs.push(`「${query.trim()}」`);
  const contextLine = contextCrumbs.join(" › ");

  const peopleHits = (() => {
    if (!query.trim()) return [] as SuggestedSeeder[];
    const extras = [
      myHandle,
      ...followingHandles,
    ].filter(Boolean);
    const local = searchDemoUsers(query, 8, { handles: extras });
    const byHandle = new Map<string, SuggestedSeeder>();
    for (const p of local) {
      byHandle.set(p.handle.toLowerCase(), p);
    }
    // Neon プロフィール（自己紹介・アイコン）を優先して上書き
    for (const p of remotePeople) {
      const key = p.handle.toLowerCase();
      const prev = byHandle.get(key);
      byHandle.set(
        key,
        prev
          ? {
              ...prev,
              displayName: p.displayName || prev.displayName,
              bio: p.bio || prev.bio,
              imageUrl: p.imageUrl ?? prev.imageUrl,
              workCount: Math.max(prev.workCount, p.workCount),
              glyph: p.imageUrl ? prev.glyph : p.glyph || prev.glyph,
              thumbTone: p.thumbTone || prev.thumbTone,
            }
          : p,
      );
    }
    return [...byHandle.values()]
      .map((p) => {
        const key = p.handle.toLowerCase();
        const fromShelf = shelf.filter(
          (w) => w.seeder.toLowerCase() === key,
        ).length;
        return {
          ...p,
          workCount: fromShelf > 0 ? fromShelf : p.workCount,
        };
      })
      .slice(0, 8);
  })();

  return (
    <AppShell
      activeTag={specialty}
      onSelectTag={selectTag}
      feedFilter={filter}
      onFeedFilter={setFeedFilter}
      onClearSearch={clearSearch}
      onHome={goHomeFeed}
      openCount={openCount}
      entranceLine={entranceLine}
    >
      <SiteHeader hideOnMd />
      {entranceLine ? (
        <p className="font-viscum-display border-b border-viscum-line px-4 py-2 text-[13px] font-normal leading-snug tracking-[0.02em] text-viscum-muted md:hidden">
          {entranceLine}
        </p>
      ) : null}
      {publishedId ? (
        <div className="border-b border-viscum-leaf/40 bg-viscum-leaf-soft/50 px-4 py-3">
          <p className="text-[14px] font-medium text-viscum-leaf-deep">
            公開しました — トップの「すべて」に載っています
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
            外への告知文は詳細からコピーできます。指名して頼むときは入口の直依頼レーンから（別ID）。
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={`/w/${encodeURIComponent(publishedId)}`}
              className="inline-flex rounded-md border border-viscum-brand px-3 py-1.5 text-[13px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
            >
              公開した詳細を見る
            </Link>
            <button
              type="button"
              className="inline-flex rounded-md border border-viscum-line px-3 py-1.5 text-[13px] font-medium text-viscum-ink hover:bg-viscum-paper-2"
              onClick={() => {
                const w = shelf.find((x) => x.id === publishedId);
                if (!w) return;
                const t = buildWorkShareText(w, window.location.origin);
                void navigator.clipboard?.writeText(t).then(() => {
                  setShareCopied(true);
                  window.setTimeout(() => setShareCopied(false), 2000);
                });
              }}
            >
              {shareCopied ? "コピーしました" : "告知文をコピー"}
            </button>
            <button
              type="button"
              className="inline-flex rounded-md bg-viscum-ink px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90"
              onClick={() => {
                const w = shelf.find((x) => x.id === publishedId);
                if (!w) return;
                const t = buildWorkShareText(w, window.location.origin);
                window.open(buildXIntentUrl(t), "_blank", "noopener,noreferrer");
              }}
            >
              Xで開く
            </button>
            <button
              type="button"
              className="text-[12px] text-viscum-muted underline"
              onClick={() => {
                setPublishedId(null);
                clearJustPublished();
              }}
            >
              この表示を消す
            </button>
          </div>
        </div>
      ) : null}
      <div className="border-b border-viscum-line px-4 py-3">
        <label className="sr-only" htmlFor="feed-search">
          キーワード検索
        </label>
        <div className="relative">
          <input
            id="feed-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル・ユーザー名・タグ"
            className="w-full rounded-md border border-viscum-line bg-white/70 py-2 pl-3 pr-16 text-sm text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none focus:ring-1 focus:ring-viscum-brand"
          />
          {query.trim() ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
            >
              クリア
            </button>
          ) : null}
        </div>
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
            指定なし
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

      <p
        className="border-b border-viscum-line bg-viscum-leaf-soft/30 px-3 py-2 text-[12px] leading-snug text-viscum-muted"
        aria-live="polite"
      >
        {contextLine}
      </p>

      <div className="flex items-center gap-2 border-b border-viscum-line px-3 py-1.5 md:hidden">
          <button
            type="button"
            onClick={() => setFeedFilter("all")}
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
            onClick={() => setFeedFilter("follow")}
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
            onClick={() => setFeedFilter("open")}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              filter === "open"
                ? "bg-viscum-berry text-white"
                : "bg-viscum-paper-2 text-viscum-muted"
            }`}
          >
            開催中 ({openCount})
          </button>
        <span className="ml-auto text-[10px] text-viscum-muted">
          {peopleHits.length > 0
            ? `ユーザー${peopleHits.length} · 作品${totalCount}`
            : pageCount > 1
              ? `${pageStart + 1}–${pageStart + pageItems.length} / ${totalCount}件`
              : `${totalCount}件`}
        </span>
      </div>

      <div className="hidden items-center justify-end border-b border-viscum-line px-3 py-1.5 md:flex">
        <span className="text-[10px] text-viscum-muted">
          {peopleHits.length > 0
            ? `ユーザー${peopleHits.length} · 作品${totalCount}`
            : pageCount > 1
              ? `${pageStart + 1}–${pageStart + pageItems.length} / ${totalCount}件`
              : `${totalCount}件`}
        </span>
      </div>

      {peopleHits.length > 0 ? (
        <section
          aria-label="ユーザー"
          className="border-b border-viscum-line px-3 py-3"
        >
          <p className="mb-2 text-[11px] font-medium text-viscum-muted">
            ユーザー
          </p>
          <ul className="space-y-1.5">
            {peopleHits.map((p) => (
              <li
                key={p.handle}
                className="flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-viscum-paper-2"
              >
                <Link
                  href={`/u/${encodeURIComponent(p.handle)}`}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${THUMB_TONE_CLASS[p.thumbTone]} ${p.thumbTone === "bark" ? "text-viscum-ink" : "text-white"}`}
                      aria-hidden
                    >
                      {p.glyph}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-baseline gap-1.5">
                      <span className="truncate text-[14px] font-medium text-viscum-ink">
                        {p.displayName}
                      </span>
                      <span className="shrink-0 text-[12px] text-viscum-muted">
                        @{p.handle}
                      </span>
                      {isDemoSeederHandle(p.handle) ? <DemoBadge /> : null}
                    </span>
                    {p.bio ? (
                      <span className="mt-0.5 block truncate text-[11px] text-viscum-muted">
                        {p.bio}
                      </span>
                    ) : null}
                  </span>
                </Link>
                <span className="shrink-0">
                  <FollowButton
                    handle={p.handle}
                    loginCallbackUrl="/"
                  />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        aria-label="一覧"
        className="lg:grid lg:grid-cols-2 lg:divide-x lg:divide-viscum-line"
      >
        {pageItems.map((w) => (
          <WorkFeedRow
            key={w.id}
            work={w}
            className="lg:border-viscum-line"
          />
        ))}
        {filter === "follow" && myHandle ? (
          <div className="col-span-full px-4 pb-10 pt-4 text-sm text-viscum-muted">
            {pageItems.length === 0 ? (
              <p className="text-center">
                {followingHandles.length === 0
                  ? "まだ誰もフォローしていません。下から選ぶか、公開PFの「フォロー」でも追加できます。"
                  : "フォロー中のユーザーに、条件に合う作品がまだありません。"}
              </p>
            ) : null}
            <div
              className={
                pageItems.length === 0
                  ? "mx-auto max-w-lg px-2"
                  : "mx-auto max-w-lg"
              }
            >
              <SuggestFollows title="おすすめ（デモ棚）" />
            </div>
          </div>
        ) : null}
        {pageItems.length === 0 && filter === "follow" && !myHandle && (
          <div className="col-span-full px-4 py-10 text-center text-sm text-viscum-muted">
            {sessionPending ? (
              <p>フォロー中を読み込み中…</p>
            ) : (
              <p>
                ログインすると、フォローしたユーザーの作品がここに並びます。{" "}
                <Link
                  href="/login?callbackUrl=%2F%3Ffeed%3Dfollow"
                  className="font-medium text-viscum-brand underline-offset-2 hover:underline"
                >
                  ログイン
                </Link>
              </p>
            )}
          </div>
        )}
        {pageItems.length === 0 &&
          filter !== "follow" &&
          peopleHits.length === 0 && (
            <p className="col-span-full px-4 py-8 text-center text-sm text-viscum-muted">
              「{query.trim() || specialty || "条件"}」に合うユーザー・作品がありません
            </p>
          )}
        {pageItems.length === 0 &&
          filter !== "follow" &&
          peopleHits.length > 0 &&
          query.trim() && (
            <p className="col-span-full px-4 py-6 text-center text-sm text-viscum-muted">
              作品のヒットはありません（上のユーザーからプロフィールへ）
            </p>
          )}
        {pageCount > 1 ? (
          <nav
            className="col-span-full flex items-center justify-center gap-3 border-t border-viscum-line px-4 py-4"
            aria-label="ページ"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="rounded-md border border-viscum-line px-3 py-1.5 text-[13px] font-medium text-viscum-ink hover:bg-viscum-paper-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              前へ
            </button>
            <span className="text-[12px] tabular-nums text-viscum-muted">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => goToPage(page + 1)}
              className="rounded-md border border-viscum-line px-3 py-1.5 text-[13px] font-medium text-viscum-ink hover:bg-viscum-paper-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              次へ
            </button>
          </nav>
        ) : null}
      </section>
      {filter === "all" && !specialty && !query.trim() ? (
        <FeedShelfCorners works={shelf} layout="bottom" />
      ) : null}
    </AppShell>
  );
}
