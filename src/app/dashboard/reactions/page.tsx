"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import {
  clearDemoReactions,
  formatReactionStamp,
  hasDemoReactions,
  installDemoReactions,
  readLocalReactions,
  type LocalReaction,
} from "@/lib/local-reactions";

export default function MyReactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      }
    >
      <MyReactionsInner />
    </Suspense>
  );
}

function MyReactionsInner() {
  const { data: session, status } = useSession();
  const [rows, setRows] = useState<LocalReaction[]>([]);
  const [demoOn, setDemoOn] = useState(false);

  function refresh() {
    setRows(
      readLocalReactions()
        .filter((r) => r.kind === "bookmark")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
    setDemoOn(hasDemoReactions());
  }

  useEffect(() => {
    refresh();
  }, []);

  if (status === "loading") {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
        <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      </BrowseChrome>
    );
  }

  if (!session?.user) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">気になる</h1>
          <p className="mt-2 text-[14px] text-viscum-muted">
            ログインすると、自分が押した履歴と打刻が見られます。
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white"
          >
            ログインへ
          </Link>
        </main>
      </BrowseChrome>
    );
  }

  return (
    <BrowseChrome>
      <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">気になる</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
            あとで戻る保存です。開催中の温度表示もここから数えます（スキは廃止）。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-viscum-muted">{rows.length} 件</p>
          {demoOn ? (
            <button
              type="button"
              onClick={() => {
                clearDemoReactions();
                refresh();
              }}
              className="text-[12px] text-viscum-muted underline"
            >
              デモを消す
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                installDemoReactions();
                refresh();
              }}
              className="text-[12px] font-medium text-viscum-brand underline"
            >
              表示デモ
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-viscum-line px-4 py-8 text-center">
            <p className="text-[13px] text-viscum-muted">
              まだありません。作品詳細やフィードで「気になる」を押すか、表示デモを入れてください。
            </p>
            <button
              type="button"
              onClick={() => {
                installDemoReactions();
                refresh();
              }}
              className="mt-4 rounded-md bg-viscum-berry px-4 py-2 text-sm font-medium text-white"
            >
              表示デモを入れる
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/w/${encodeURIComponent(r.workId)}`}
                  className="block rounded-lg border border-viscum-line bg-white/60 px-3 py-3 transition-colors hover:border-viscum-brand hover:bg-viscum-leaf-soft/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-viscum-leaf-soft px-2 py-0.5 text-[10px] font-medium text-viscum-brand">
                      気になる
                    </span>
                    <time
                      className="text-[11px] tabular-nums text-viscum-muted"
                      dateTime={r.createdAt}
                    >
                      {formatReactionStamp(r.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[14px] font-medium leading-snug text-viscum-ink">
                    {r.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </BrowseChrome>
  );
}
