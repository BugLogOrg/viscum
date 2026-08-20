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
  isLocalSeedListed,
  deleteLocalSeed,
  unlistLocalSeed,
  publishLocalSeedToShelf,
  type LocalSeed,
} from "@/lib/local-seeds";

function SeedMetrics({ s }: { s: LocalSeed }) {
  return (
    <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-viscum-line pt-3 text-center">
      <div>
        <dt className="text-[10px] text-viscum-muted">閲覧</dt>
        <dd className="text-[15px] font-semibold text-viscum-ink">{s.viewCount}</dd>
      </div>
      <div>
        <dt className="text-[10px] text-viscum-muted">スキ</dt>
        <dd className="text-[15px] font-semibold text-viscum-ink">{s.emoCount}</dd>
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
  );
}

function SeedCardChrome({ s }: { s: LocalSeed }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          status={s.status}
          prizeYen={s.prizeYen ?? s.extPrizeYen}
          planLabel={s.planLabel}
          dense
        />
        {isDemoSeed(s.id) && (
          <span className="rounded-full bg-viscum-paper-2 px-2 py-0.5 text-[10px] font-medium text-viscum-muted">
            表示デモ
          </span>
        )}
        {s.id.startsWith("local_") && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isLocalSeedListed(s)
                ? "bg-viscum-leaf-soft text-viscum-leaf-deep"
                : "bg-viscum-paper-2 text-viscum-muted"
            }`}
          >
            {isLocalSeedListed(s) ? "公開中" : "下書き"}
          </span>
        )}
        {(s.prizeYen != null || s.extPrizeYen != null) && s.status === "open" && (
          <span className="text-[11px] text-viscum-muted">
            予算 {formatYen(s.prizeYen ?? s.extPrizeYen ?? 0)}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[14px] font-medium leading-snug text-viscum-ink line-clamp-2">
        {s.title}
      </p>
      <SeedMetrics s={s} />
    </>
  );
}

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

  const drafts = useMemo(
    () =>
      mine.filter(
        (s) => s.id.startsWith("local_") && !isDemoSeed(s.id) && !isLocalSeedListed(s),
      ),
    [mine],
  );
  const published = useMemo(
    () =>
      mine.filter(
        (s) =>
          isDemoSeed(s.id) ||
          !s.id.startsWith("local_") ||
          isLocalSeedListed(s),
      ),
    [mine],
  );

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
      <main className="max-w-lg space-y-8 px-4 py-6">
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
                プロフィールを見る
              </Link>
              <Link
                href="/dashboard/messages"
                className="text-[13px] font-medium text-viscum-brand underline"
              >
                ご依頼DM
              </Link>
              <a
                href="#drafts"
                className="text-[13px] font-medium text-viscum-brand underline"
              >
                下書き
                {drafts.length > 0 ? `（${drafts.length}）` : ""}
              </a>
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

        <section id="drafts" className="scroll-mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-viscum-ink">
              下書き（未公開）
              {drafts.length > 0 ? (
                <span className="ml-1.5 text-[13px] font-normal text-viscum-muted">
                  {drafts.length}件
                </span>
              ) : null}
            </h2>
            <Link
              href="/new"
              className="text-[13px] font-medium text-viscum-brand underline"
            >
              シードする
            </Link>
          </div>
          <p className="text-[11px] leading-relaxed text-viscum-muted">
            シード直後はここに入ります（トップの棚には出ません）。「公開する」でみんなの作品へ。
            ※直依頼フォームの「一時保存」とは別物です。
          </p>
          {drafts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-viscum-line px-4 py-5 text-center">
              <p className="text-[13px] text-viscum-muted">下書きはありません。</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {drafts.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-viscum-line bg-white/50 px-3 py-3"
                >
                  <SeedCardChrome s={s} />
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-viscum-line pt-2">
                    <button
                      type="button"
                      className="rounded-md bg-viscum-berry px-3 py-1.5 text-[12px] font-medium text-white hover:bg-viscum-berry-deep"
                      onClick={() => {
                        if (
                          !window.confirm(
                            "トップの「みんなの作品」に公開しますか？",
                          )
                        ) {
                          return;
                        }
                        const row = publishLocalSeedToShelf(s.id);
                        if (row) refresh();
                        else window.alert("公開に失敗しました");
                      }}
                    >
                      公開する
                    </button>
                    <Link
                      href={`/w/${encodeURIComponent(s.id)}?seeded=1`}
                      className="rounded-md border border-viscum-brand px-3 py-1.5 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                    >
                      公開／直依頼を選ぶ
                    </Link>
                    <Link
                      href={`/w/${encodeURIComponent(s.id)}`}
                      className="px-1 py-1.5 text-[12px] text-viscum-brand underline"
                    >
                      詳細
                    </Link>
                    <button
                      type="button"
                      className="px-1 py-1.5 text-[12px] text-viscum-berry-deep underline"
                      onClick={() => {
                        if (
                          !window.confirm(
                            "この下書きを削除しますか？元に戻せません。",
                          )
                        ) {
                          return;
                        }
                        const res = deleteLocalSeed(s.id, handle);
                        if (res.ok) refresh();
                        else window.alert(res.error);
                      }}
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-viscum-ink">
              公開中のシード
              {published.length > 0 ? (
                <span className="ml-1.5 text-[13px] font-normal text-viscum-muted">
                  {published.length}件
                </span>
              ) : null}
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
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-viscum-muted">
            {demoOn
              ? "いまは見た目確認用のデモも混ざっています。カードを開くと成績シートへ。"
              : "トップに載っているシードの成績です。「下書きに戻す」で棚から外せます。"}
          </p>

          {published.length === 0 ? (
            <div className="rounded-lg border border-dashed border-viscum-line px-4 py-6 text-center">
              <p className="text-[13px] leading-relaxed text-viscum-muted">
                公開中のシードはまだありません。
              </p>
              <Link
                href="/new"
                className="mt-4 inline-flex rounded-md bg-viscum-berry px-4 py-2 text-sm font-medium text-white hover:bg-viscum-berry-deep"
              >
                シードする
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {published.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-viscum-line bg-white/50 px-3 py-3"
                >
                  <Link
                    href={`/dashboard/${encodeURIComponent(s.id)}`}
                    className="block transition-colors hover:opacity-90"
                  >
                    <SeedCardChrome s={s} />
                    <p className="mt-2 text-right text-[11px] text-viscum-brand">
                      成績を見る →
                    </p>
                  </Link>
                  {s.id.startsWith("local_") && !isDemoSeed(s.id) ? (
                    <div className="mt-2 flex flex-wrap gap-2 border-t border-viscum-line pt-2">
                      {isLocalSeedListed(s) ? (
                        <button
                          type="button"
                          className="rounded-md border border-viscum-line px-2.5 py-1 text-[12px] font-medium text-viscum-ink hover:bg-viscum-paper-2"
                          onClick={() => {
                            const res = unlistLocalSeed(s.id, handle);
                            if (res.ok) refresh();
                            else window.alert(res.error);
                          }}
                        >
                          下書きに戻す
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-[12px] text-viscum-berry-deep underline"
                        onClick={() => {
                          if (
                            !window.confirm(
                              "このシードを削除しますか？元に戻せません。",
                            )
                          ) {
                            return;
                          }
                          const res = deleteLocalSeed(s.id, handle);
                          if (res.ok) refresh();
                          else window.alert(res.error);
                        }}
                      >
                        削除
                      </button>
                      <Link
                        href={`/w/${encodeURIComponent(s.id)}`}
                        className="text-[12px] text-viscum-brand underline"
                      >
                        詳細
                      </Link>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </BrowseChrome>
  );
}
