"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DUMMY_WORKS, type Work } from "@/data/dummy-works";
import {
  FOLLOWS_UPDATED,
  clearRememberedViewer,
  listFollowing,
  readRememberedViewer,
  rememberViewer,
} from "@/lib/local-follows";
import {
  getDemoSeederProfile,
  searchDemoUsers,
  THUMB_TONE_CLASS,
  type SuggestedSeeder,
} from "@/data/suggested-seeders";
import { fetchRemoteProfile } from "@/lib/local-profile";
import { loadClientShelfWorks } from "@/lib/hot-open-ranking";
import { buildWorkShareText, buildXIntentUrl } from "@/lib/work-share-text";
import { WorkFeedRow } from "@/components/WorkFeedRow";
import { AppShell } from "@/components/AppShell";
import { SiteHeader } from "@/components/SiteHeader";
import { SuggestFollows } from "@/components/SuggestFollows";
import { FollowButton } from "@/components/FollowButton";

type Filter = "all" | "open" | "follow";

function matchesQuery(w: Work, q: string): boolean {
  const needle = q.trim().toLowerCase().replace(/^@/, "");
  if (!needle) return true;
  const demo = getDemoSeederProfile(w.seeder);
  const hay = [
    w.title,
    w.tagline,
    w.seeder,
    w.seederAccountName ?? "",
    demo?.displayName ?? "",
    w.description,
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

export function FeedClient() {
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
  const [shelf, setShelf] = useState<Work[]>(() => [...DUMMY_WORKS]);
  const publishedId = searchParams.get("published");
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const refresh = () => setShelf(loadClientShelfWorks());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [publishedId]);

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
    const sync = () => {
      setFollowingHandles(viewerHandle ? listFollowing(viewerHandle) : []);
    };
    sync();
    window.addEventListener(FOLLOWS_UPDATED, sync);
    window.addEventListener("storage", sync);
    return () => {
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
      setRemotePeople([
        {
          handle: key,
          displayName: remote.accountName?.trim() || demo?.displayName || key,
          bio: remote.bio?.trim() || demo?.bio || "作品はまだありません",
          thumbTone: demo?.thumbTone ?? "leaf",
          glyph:
            demo?.glyph ??
            (remote.accountName?.trim() || key).slice(0, 1).toUpperCase(),
          workCount: DUMMY_WORKS.filter(
            (w) => w.seeder.toLowerCase() === key,
          ).length,
        },
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const myHandle = viewerHandle;
  const sessionPending = status === "loading" && !myHandle;
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

  const openCount = shelf.filter(
    (w) => w.status === "open" || w.status === "pay_soon",
  ).length;

  const title =
    filter === "open" ? "開催中" : filter === "follow" ? "フォロー中" : "すべて";

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
        ? "コメントコンペ開催中 · 場内で反応を募集"
        : "みんなの作品",
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
    const seen = new Set(local.map((p) => p.handle.toLowerCase()));
    const merged = [...local];
    for (const p of remotePeople) {
      if (seen.has(p.handle.toLowerCase())) continue;
      merged.push(p);
      seen.add(p.handle.toLowerCase());
    }
    return merged.slice(0, 8);
  })();

  return (
    <AppShell
      activeTag={specialty}
      onSelectTag={selectTag}
      feedFilter={filter}
      onFeedFilter={setFilter}
      openCount={openCount}
    >
      <SiteHeader hideOnMd />
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
              onClick={() => router.replace("/")}
            >
              この表示を消す
            </button>
          </div>
        </div>
      ) : null}
      <div className="border-b border-viscum-line px-4 py-3">
        <h1 className="text-xl font-semibold text-viscum-ink">{title}</h1>

        <label className="sr-only" htmlFor="feed-search">
          キーワード検索
        </label>
        <input
          id="feed-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトル・ユーザー名・タグ"
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

      <p
        className="border-b border-viscum-line bg-viscum-leaf-soft/30 px-3 py-2 text-[12px] leading-snug text-viscum-muted"
        aria-live="polite"
      >
        {contextLine}
      </p>

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
          {peopleHits.length > 0
            ? `ユーザー${peopleHits.length} · 作品${rest.length}`
            : `${rest.length}件`}
        </span>
      </div>

      <div className="hidden items-center justify-end border-b border-viscum-line px-3 py-1.5 md:flex">
        <span className="text-[10px] text-viscum-muted">
          {peopleHits.length > 0
            ? `ユーザー${peopleHits.length} · 作品${rest.length}`
            : `${rest.length}件`}
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
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${THUMB_TONE_CLASS[p.thumbTone]} ${p.thumbTone === "bark" ? "text-viscum-ink" : "text-white"}`}
                    aria-hidden
                  >
                    {p.glyph}
                  </span>
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-baseline gap-1.5">
                      <span className="truncate text-[14px] font-medium text-viscum-ink">
                        {p.displayName}
                      </span>
                      <span className="shrink-0 text-[12px] text-viscum-muted">
                        @{p.handle}
                      </span>
                    </span>
                    {p.bio ? (
                      <span className="mt-0.5 block truncate text-[11px] text-viscum-muted">
                        {p.bio}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-[11px] text-viscum-muted">
                      {p.workCount > 0
                        ? `作品 ${p.workCount}`
                        : "作品はまだありません"}
                    </span>
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
        {rest.map((w) => (
          <WorkFeedRow
            key={w.id}
            work={w}
            className="lg:border-viscum-line"
          />
        ))}
        {filter === "follow" && myHandle ? (
          <div className="col-span-full px-4 pb-10 pt-4 text-sm text-viscum-muted">
            {rest.length === 0 ? (
              <p className="text-center">
                {followingHandles.length === 0
                  ? "まだ誰もフォローしていません。下から選ぶか、公開PFの「フォロー」でも追加できます。"
                  : "フォロー中のユーザーに、条件に合う作品がまだありません。"}
              </p>
            ) : null}
            <div className={rest.length === 0 ? "mx-auto max-w-lg px-2" : "mx-auto max-w-lg"}>
              <SuggestFollows title="おすすめ（デモ棚）" />
            </div>
          </div>
        ) : null}
        {rest.length === 0 && filter === "follow" && !myHandle && (
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
        {rest.length === 0 && filter !== "follow" && peopleHits.length === 0 && (
          <p className="col-span-full px-4 py-8 text-center text-sm text-viscum-muted">
            「{query.trim() || specialty || "条件"}」に合うユーザー・作品がありません
          </p>
        )}
        {rest.length === 0 &&
          filter !== "follow" &&
          peopleHits.length > 0 &&
          query.trim() && (
            <p className="col-span-full px-4 py-6 text-center text-sm text-viscum-muted">
              作品のヒットはありません（上のユーザーからプロフィールへ）
            </p>
          )}
      </section>
    </AppShell>
  );
}
