"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { HeaderAccountActions } from "@/components/HeaderAccountActions";
import { ViscumMark } from "@/components/ViscumMark";

/** 加入時専門のチップ一覧（本番はプロフィールから） */
export const DEMO_SPECIALTIES = [
  "アプリ",
  "小説",
  "動画",
  "デザイン",
  "ツール",
] as const;

/**
 * 左カラム＋メイン。
 * - feed: フィード上でフィルタを state 操作
 * - chrome: 作品詳細・/me など。ナビはホームへのリンク（左カラム常時）
 * アカウント操作は右上メニューへ（左には棚ナビのみ）
 */
export function AppShell({
  children,
  activeTag,
  onSelectTag,
  feedFilter = "all",
  onFeedFilter,
  openCount,
  showSpecialty = true,
  variant = "feed",
}: {
  children: ReactNode;
  activeTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
  feedFilter?: "all" | "open" | "follow";
  onFeedFilter?: (f: "all" | "open" | "follow") => void;
  openCount?: number;
  showSpecialty?: boolean;
  variant?: "feed" | "chrome";
}) {
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

  return (
    <div className="mx-auto min-h-dvh max-w-7xl bg-viscum-paper md:flex">
      <aside className="hidden w-52 shrink-0 border-r border-viscum-line md:flex md:flex-col md:sticky md:top-0 md:h-dvh md:overflow-y-auto">
        <div className="border-b border-viscum-line px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold tracking-[0.12em] text-viscum-brand"
            title="VISCUM／ヤドリギ"
          >
            <ViscumMark className="h-5 w-5" />
            VISCUM
          </Link>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-3 text-sm">
          {interactive ? (
            <>
              <button
                type="button"
                onClick={() => onFeedFilter("all")}
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
              作品を棚に並べる
            </span>
          </Link>
        </nav>

        {showSpecialty && (
          <div className="mt-1 border-t border-viscum-line px-3 py-3">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-viscum-brand">
              専門
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
                    すべて
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-viscum-muted hover:bg-viscum-paper-2"
                  >
                    すべて
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

      <div className="min-w-0 flex-1 lg:border-r lg:border-viscum-line">
        <div className="sticky top-0 z-10 hidden h-12 items-center justify-end border-b border-viscum-line bg-viscum-paper/95 px-4 backdrop-blur-sm md:flex">
          <HeaderAccountActions />
        </div>
        {children}
      </div>
    </div>
  );
}
