"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatYen } from "@/data/dummy-works";
import {
  readLocalSeeds,
  type LocalSeed,
} from "@/lib/local-seeds";

export default function MePage() {
  const { data: session, status } = useSession();
  const [seeds, setSeeds] = useState<LocalSeed[]>([]);

  useEffect(() => {
    setSeeds(readLocalSeeds());
  }, [session?.user?.handle]);

  const mine = useMemo(() => {
    const h = session?.user?.handle;
    if (!h) return [];
    return seeds.filter((s) => s.seederHandle === h);
  }, [seeds, session?.user?.handle]);

  const totals = useMemo(() => {
    return mine.reduce(
      (acc, s) => {
        acc.views += s.viewCount;
        acc.emo += s.emoCount;
        acc.bookmarks += s.bookmarkCount;
        acc.comments += s.commentCount;
        return acc;
      },
      { views: 0, emo: 0, bookmarks: 0, comments: 0 },
    );
  }, [mine]);

  if (status === "loading") {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper px-4 py-10 text-sm text-viscum-muted">
        読み込み中…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
        <SiteHeader backHref="/" />
        <main className="px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">マイシード</h1>
          <p className="mt-2 text-[14px] text-viscum-muted">
            ログインすると、自分のシードの広告実績が見られます。
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white"
          >
            ログインへ
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/" />
      <main className="px-4 py-6 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-viscum-muted">シーダー</p>
            <h1 className="text-xl font-semibold text-viscum-ink">
              @{session.user.handle}
            </h1>
            <p className="mt-1 text-[12px] text-viscum-muted">
              ここは自分用の成績です。公開プロフィールの信用欄には出しません（支払い事実とは分離）。
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

        <section className="rounded-xl border border-viscum-line bg-white/50 px-4 py-4">
          <h2 className="text-[14px] font-semibold text-viscum-ink">
            広告の届き方（合計）
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <dt className="text-viscum-muted">閲覧</dt>
              <dd className="text-lg font-semibold text-viscum-ink">
                {totals.views}
              </dd>
            </div>
            <div>
              <dt className="text-viscum-muted">EMO（スキ相当）</dt>
              <dd className="text-lg font-semibold text-viscum-ink">
                {totals.emo}
              </dd>
            </div>
            <div>
              <dt className="text-viscum-muted">気になる</dt>
              <dd className="text-lg font-semibold text-viscum-ink">
                {totals.bookmarks}
              </dd>
            </div>
            <div>
              <dt className="text-viscum-muted">コメント</dt>
              <dd className="text-lg font-semibold text-viscum-ink">
                {totals.comments}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-viscum-muted">
            Neon未接続のあいだは、この端末に保存したシードの集計です。DB接続後はサーバ集計に切り替えます。
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-viscum-ink">
              自分のシード
            </h2>
            <Link
              href="/new"
              className="text-[13px] font-medium text-viscum-brand underline"
            >
              シードする
            </Link>
          </div>

          {mine.length === 0 ? (
            <p className="rounded-lg border border-dashed border-viscum-line px-4 py-6 text-[13px] text-viscum-muted">
              まだありません。ログインした状態でシードすると、ここに成績が並びます。
            </p>
          ) : (
            <ul className="space-y-3">
              {mine.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-viscum-line bg-white/40 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={s.status}
                      prizeYen={s.prizeYen}
                      dense
                    />
                    {s.prizeYen != null && s.status === "open" && (
                      <span className="text-[11px] text-viscum-muted">
                        {formatYen(s.prizeYen)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[14px] font-medium leading-snug text-viscum-ink line-clamp-2">
                    {s.title}
                  </p>
                  <p className="mt-2 text-[12px] text-viscum-muted">
                    閲覧 {s.viewCount} · EMO {s.emoCount} · 気になる{" "}
                    {s.bookmarkCount} · コメント {s.commentCount}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-sm">
          <Link
            href={`/u/${encodeURIComponent(session.user.handle)}`}
            className="text-viscum-brand underline"
          >
            公開ポートフォリオ（支払い事実）
          </Link>
        </p>
      </main>
    </div>
  );
}
