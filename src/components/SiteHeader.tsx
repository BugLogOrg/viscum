"use client";

import Link from "next/link";
import { HeaderAccountActions } from "@/components/HeaderAccountActions";
import { ViscumMark } from "@/components/ViscumMark";

export function SiteHeader({
  title = "VISCUM",
  backHref,
  /** 左カラムあり: md以上はヘッダごと隠す（シードは左ナビ）。モバイルだけ右上CTA */
  hideOnMd = false,
  /** /new・login・設定など、シードCTA自体が不要な面だけ true */
  hidePostCta = false,
  /** ログイン／オンボなど：通知・アカウント操作を出さない */
  hideAccountActions = false,
  /** Phase 2: ロゴ横の入口一文（モバイル） */
  entranceLine,
}: {
  title?: string;
  backHref?: string;
  hideOnMd?: boolean;
  hidePostCta?: boolean;
  hideAccountActions?: boolean;
  entranceLine?: string | null;
}) {
  return (
    <header
      className={`sticky top-0 z-10 border-b border-viscum-line bg-viscum-paper/95 backdrop-blur-sm ${
        hideOnMd ? "md:hidden" : ""
      }`}
    >
      <div className="flex h-12 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {backHref ? (
            <Link
              href={backHref}
              className="shrink-0 text-sm text-viscum-brand hover:underline"
            >
              ← 戻る
            </Link>
          ) : (
            <Link
              href="/"
              className="flex shrink-0 items-center gap-1.5 text-sm font-semibold tracking-wide text-viscum-brand"
              title="VISCUM／ヤドリギ"
            >
              <ViscumMark className="h-5 w-5" />
              <span className="tracking-[0.12em]">{title}</span>
            </Link>
          )}
          {entranceLine && !backHref ? (
            <p className="min-w-0 truncate text-[11px] leading-snug text-viscum-ink sm:text-[12px]">
              {entranceLine}
            </p>
          ) : null}
        </div>
        {!hideAccountActions || !hidePostCta ? (
          <div className="flex shrink-0 items-center gap-1">
            {!hideAccountActions ? <HeaderAccountActions /> : null}
            {!hidePostCta && (
              <Link
                href="/new"
                title="作品をシードする（棚に並べる）"
                className="ml-1 rounded-md bg-viscum-berry px-2.5 py-1.5 text-xs font-medium text-white hover:bg-viscum-berry-deep"
              >
                シードする
              </Link>
            )}
          </div>
        ) : (
          <span className="w-0" aria-hidden />
        )}
      </div>
    </header>
  );
}
