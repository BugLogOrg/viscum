"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { HeaderAccountActions } from "@/components/HeaderAccountActions";
import { SiteFooter } from "@/components/SiteFooter";
import { ViscumMark } from "@/components/ViscumMark";
import { DEMO_SPECIALTIES } from "@/data/specialties";
import { VISCUM_ENTRANCE_LINE } from "@/lib/brand-copy";

export { DEMO_SPECIALTIES };

/**
 * 左カラム＋メイン。
 * - feed: フィード上でフィルタを state 操作
 * - chrome: 作品詳細・/dashboard など。ナビはホームへのリンク（左カラム常時）
 * アカウント操作は右上メニューへ（左には棚ナビのみ）
 * 入口一文はシェル常駐（md帯）。モバイルは SiteHeader 側。
 */
export function AppShell({
  children,
  activeTag,
  onSelectTag,
  feedFilter = "all",
  onFeedFilter,
  onClearSearch,
  onHome,
  openCount,
  showSpecialty = true,
  variant = "feed",
  /** undefined=既定文言／null=非表示／文字列=上書き */
  entranceLine,
}: {
  children: ReactNode;
  activeTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
  feedFilter?: "all" | "open" | "follow";
  onFeedFilter?: (f: "all" | "open" | "follow") => void;
  /** 検索欄を空にする（ロゴ／すべて用） */
  onClearSearch?: () => void;
  /** ロゴ：すべて＋検索クリア＋カテゴリーリセット */
  onHome?: () => void;
  openCount?: number;
  showSpecialty?: boolean;
  variant?: "feed" | "chrome";
  entranceLine?: string | null;
}) {
  const resolvedEntrance =
    entranceLine === null
      ? null
      : entranceLine === undefined
        ? VISCUM_ENTRANCE_LINE
        : entranceLine;
  const interactive = variant === "feed" && !!onFeedFilter;
  const shelfActive = interactive && feedFilter === "all";
  const followActive = interactive && feedFilter === "follow";
  const openActive = interactive && feedFilter === "open";

  function navClass(active: boolean, emphasize?: "leaf" | "berry") {
    if (active) {
      return emphasize === "berry"
        ? "bg-viscum-berry/15 font-medium text-viscum-berry-deep"
        : "bg-viscum-leaf-soft font-medium text-viscum-leaf-deep";
    }
    return "text-viscum-ink hover:bg-viscum-paper-2";
  }

  function goAll() {
    if (onHome) {
      onHome();
      return;
    }
    onFeedFilter?.("all");
    onSelectTag?.(null);
    onClearSearch?.();
  }

  return (
    <div className="mx-auto min-h-dvh max-w-7xl bg-viscum-paper md:flex">
      <aside className="hidden w-52 shrink-0 border-r border-viscum-line md:flex md:flex-col md:sticky md:top-0 md:h-dvh md:overflow-y-auto">
        <div className="flex h-12 shrink-0 items-center border-b border-viscum-line px-4">
          {interactive && onHome ? (
            <button
              type="button"
              onClick={onHome}
              className="flex items-center gap-2 text-[17px] font-semibold tracking-[0.12em] text-viscum-brand"
              title="VISCUM／ヤドリギ"
            >
              <ViscumMark className="h-7 w-7" />
              VISCUM
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 text-[17px] font-semibold tracking-[0.12em] text-viscum-brand"
              title="VISCUM／ヤドリギ"
            >
              <ViscumMark className="h-7 w-7" />
              VISCUM
            </Link>
          )}
        </div>
        <nav className="flex flex-col gap-1 px-3 py-3 text-sm">
          {interactive ? (
            <>
              <button
                type="button"
                onClick={goAll}
                className={`rounded-md px-2 py-1.5 text-left transition ${
                  shelfActive
                    ? "bg-viscum-leaf-soft font-medium text-viscum-leaf-deep"
                    : "font-medium text-viscum-ink hover:bg-viscum-paper-2"
                }`}
              >
                すべて
              </button>
              <button
                type="button"
                onClick={() => onFeedFilter("follow")}
                className={`rounded-md px-2 py-1.5 text-left transition ${navClass(followActive)}`}
              >
                フォロー中
              </button>
              <button
                type="button"
                onClick={() => onFeedFilter("open")}
                className={`rounded-md px-2 py-1.5 text-left transition ${navClass(openActive, "berry")}`}
              >
                開催中
                {typeof openCount === "number" && (
                  <span className="ml-1 text-xs text-viscum-muted">
                    ({openCount})
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="rounded-md px-2 py-1.5 font-medium text-viscum-ink hover:bg-viscum-paper-2"
              >
                すべて
              </Link>
              <Link
                href="/?feed=follow"
                className="rounded-md px-2 py-1.5 text-viscum-ink hover:bg-viscum-paper-2"
              >
                フォロー中
              </Link>
              <Link
                href="/?feed=open"
                className="rounded-md px-2 py-1.5 text-viscum-ink hover:bg-viscum-paper-2"
              >
                開催中
                {typeof openCount === "number" && (
                  <span className="ml-1 text-xs text-viscum-muted">
                    ({openCount})
                  </span>
                )}
              </Link>
            </>
          )}
          <Link
            href="/new"
            className="mt-1 rounded-md bg-viscum-berry px-2 py-2 text-left text-sm font-medium text-white transition hover:bg-viscum-berry-deep"
          >
            シードする
            <span className="mt-0.5 block text-[10px] font-normal text-white/85">
              棚に出す／指名して頼む
            </span>
          </Link>
        </nav>

        {showSpecialty && (
          <div className="mt-1 border-t border-viscum-line px-3 py-3">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-viscum-brand">
              カテゴリー
            </p>
            <ul className="space-y-0.5">
              <li>
                {interactive ? (
                  <button
                    type="button"
                    onClick={() => onSelectTag?.(null)}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-xs ${
                      !activeTag
                        ? "bg-viscum-leaf-soft font-medium text-viscum-leaf-deep"
                        : "text-viscum-muted hover:bg-viscum-paper-2"
                    }`}
                  >
                    指定なし
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-viscum-muted hover:bg-viscum-paper-2"
                  >
                    指定なし
                  </Link>
                )}
              </li>
              {DEMO_SPECIALTIES.map((tag) => (
                <li key={tag}>
                  {interactive ? (
                    <button
                      type="button"
                      onClick={() => onSelectTag?.(tag)}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-xs ${
                        activeTag === tag
                          ? "bg-viscum-berry/15 font-medium text-viscum-berry-deep"
                          : "text-viscum-ink hover:bg-viscum-paper-2"
                      }`}
                    >
                      {tag}
                    </button>
                  ) : (
                    <Link
                      href={`/?tag=${encodeURIComponent(tag)}`}
                      className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-viscum-ink hover:bg-viscum-paper-2"
                    >
                      {tag}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] leading-relaxed text-viscum-muted">
              加入時に登録 → 一致する開催中を通知（準備中）
            </p>
          </div>
        )}
      </aside>

      <div className="min-w-0 flex-1 lg:pr-2">
        <div className="sticky top-0 z-10 hidden h-12 items-center gap-3 border-b border-viscum-line bg-viscum-paper/95 px-4 backdrop-blur-sm md:flex">
          {resolvedEntrance ? (
            <p className="font-viscum-display min-w-0 flex-1 truncate text-[13px] font-normal leading-snug tracking-[0.02em] text-viscum-muted">
              {resolvedEntrance}
            </p>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}
          <HeaderAccountActions />
        </div>
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
