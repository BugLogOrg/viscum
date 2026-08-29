"use client";

import { useEffect, useState } from "react";
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
}: {
  title?: string;
  backHref?: string;
  hideOnMd?: boolean;
  hidePostCta?: boolean;
  hideAccountActions?: boolean;
}) {
  // hideOnMd 時、md以上は AppShell 側の HeaderAccountActions だけにする（二重 fetch 防止）
  const [showMobileAccount, setShowMobileAccount] = useState(!hideOnMd);

  useEffect(() => {
    if (!hideOnMd) {
      setShowMobileAccount(true);
      return;
    }
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setShowMobileAccount(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [hideOnMd]);

  const accountVisible = !hideAccountActions && showMobileAccount;

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
              className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold tracking-wide text-viscum-brand"
              title="VISCUM／ヤドリギ"
            >
              <ViscumMark className="h-6 w-6" />
              <span className="tracking-[0.12em] text-[15px]">{title}</span>
            </Link>
          )}
        </div>
        {accountVisible || !hidePostCta ? (
          <div className="flex shrink-0 items-center gap-1">
            {accountVisible ? <HeaderAccountActions /> : null}
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
