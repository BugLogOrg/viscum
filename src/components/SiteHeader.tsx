"use client";

import Link from "next/link";
import { HeaderAccountActions } from "@/components/HeaderAccountActions";

export function SiteHeader({
  title = "VISCUM",
  backHref,
  /** フィード（AppShellあり）: md以上はヘッダごと隠す（左カラムがブランド＆ナビ） */
  hideOnMd = false,
  /** 投稿ページなど、右の「シードする」を出さない */
  hidePostCta = false,
}: {
  title?: string;
  backHref?: string;
  hideOnMd?: boolean;
  hidePostCta?: boolean;
}) {
  return (
    <header
      className={`sticky top-0 z-10 border-b border-viscum-line bg-viscum-paper/95 backdrop-blur-sm ${
        hideOnMd ? "md:hidden" : ""
      }`}
    >
      <div className="flex h-12 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
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
              className="truncate text-sm font-semibold tracking-wide text-viscum-brand"
              title="VISCUM／ヤドリギ"
            >
              <span aria-hidden className="mr-1">
                🐦
              </span>
              <span className="tracking-[0.12em]">{title}</span>
            </Link>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <HeaderAccountActions />
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
      </div>
    </header>
  );
}
