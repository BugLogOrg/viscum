"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatYen } from "@/data/dummy-works";
import {
  readLocalSeeds,
  installDemoSeeds,
  clearDemoSeeds,
  hasDemoSeeds,
  isDemoSeed,
  type LocalSeed,
} from "@/lib/local-seeds";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [seeds, setSeeds] = useState<LocalSeed[]>([]);
  const [demoOn, setDemoOn] = useState(false);

  function refresh() {
    const h = session?.user?.handle;
    setSeeds(readLocalSeeds());
    setDemoOn(h ? hasDemoSeeds(h) : false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.handle]);

  const mine = useMemo(() => {
    const h = session?.user?.handle;
    if (!h) return [];
    return seeds.filter((s) => s.seederHandle === h);
  }, [seeds, session?.user?.handle]);

  if (status === "loading") {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/" hideOnMd />
        <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      </BrowseChrome>
    );
  }

  if (!session?.user) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/" hideOnMd />
        <main className="max-w-lg px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">ダッシュボード</h1>
          <p className="mt-2 text-[14px] text-viscum-muted">
            ログインすると、シードごとの届き方が見られます。
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

  const handle = session.user.handle;

  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd />
      <main className="max-w-lg space-y-6 px-4 py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-viscum-muted">自分だけが見る画面</p>
            <h1 className="text-xl font-semibold text-viscum-ink">
              ダッシュボード
            </h1>
            <p className="mt-0.5 text-[13px] text-viscum-muted">@{handle}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
              シードごとの届き方・成績はここに閉じます（キャンペーン単位）。
              公開プロフィールの信用欄には出しません。
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href={`/u/${encodeURIComponent(handle)}`}
                className="text-[13px] font-medium text-viscum-brand underline"
              >
                公開ポートフォリオを見る
              </Link>
              <Link
                href="/dashboard/messages"
                className="text-[13px] font-medium text-viscum-brand underline"
              >
                ご依頼DM
              </Link>
              <Link
                href="/dashboard/reactions"
                className="text-[13px] font-medium text-viscum-brand underline"
              >
                自分が押したスキ・気になる（打刻つき）
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="shrink-0 text-[12px] text-viscum-muted underline"
          >
            ログアウト
          </button>
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-viscum-ink">
              シードごとの届き方
            </h2>
            <div className="flex items-center gap-3">
              {demoOn ? (
                <button
                  type="button"
                  onClick={() => {
                    clearDemoSeeds(handle);
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
                    installDemoSeeds(handle);
                    refresh();
                  }}
                  className="rounded-md border border-viscum-brand px-2.5 py-1 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                >
                  表示デモを入れる
                </button>
              )}
              <Link
                href="/new"
                className="text-[13px] font-medium text-viscum-brand underline"
              >
                シードする
              </Link>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-viscum-muted">
            {demoOn
              ? "いまは見た目確認用のデモ3本です。カードを開くと成績シート（折れ線）→作品詳細の二段です。"
              : "カードを開くと成績シート（増減）へ。その先で作品詳細へ進めます。空なら「表示デモを入れる」で確認できます。"}
          </p>

          {mine.length === 0 ? (
            <div className="rounded-lg border border-dashed border-viscum-line px-4 py-6 text-center">
              <p className="text-[13px] leading-relaxed text-viscum-muted">
                まだありません。
              </p>
              <button
                type="button"
                onClick={() => {
                  installDemoSeeds(handle);
                  refresh();
                }}
                className="mt-4 rounded-md bg-viscum-berry px-4 py-2 text-sm font-medium text-white hover:bg-viscum-berry-deep"
              >
                表示デモを入れる
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {mine.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/${encodeURIComponent(s.id)}`}
                    className="block rounded-lg border border-viscum-line bg-white/50 px-3 py-3 transition-colors hover:border-viscum-brand hover:bg-viscum-leaf-soft/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={s.status}
                        prizeYen={s.prizeYen}
                        dense
                      />
                      {isDemoSeed(s.id) && (
                        <span className="rounded-full bg-viscum-paper-2 px-2 py-0.5 text-[10px] font-medium text-viscum-muted">
                          表示デモ
                        </span>
                      )}
                      {s.prizeYen != null && s.status === "open" && (
                        <span className="text-[11px] text-viscum-muted">
                          チップ {formatYen(s.prizeYen)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[14px] font-medium leading-snug text-viscum-ink line-clamp-2">
                      {s.title}
                    </p>
                    <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-viscum-line pt-3 text-center">
                      <div>
                        <dt className="text-[10px] text-viscum-muted">閲覧</dt>
                        <dd className="text-[15px] font-semibold text-viscum-ink">
                          {s.viewCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-viscum-muted">スキ</dt>
                        <dd className="text-[15px] font-semibold text-viscum-ink">
                          {s.emoCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-viscum-muted">気になる</dt>
                        <dd className="text-[15px] font-semibold text-viscum-ink">
                          {s.bookmarkCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-viscum-muted">コメント</dt>
                        <dd className="text-[15px] font-semibold text-viscum-ink">
                          {s.commentCount}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-right text-[11px] text-viscum-brand">
                      成績を見る →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </BrowseChrome>
  );
}
