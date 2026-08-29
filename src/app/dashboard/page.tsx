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
  isDirectRequestLane,
  isClientSeedId,
  deleteLocalSeed,
  unlistLocalSeed,
  publishLocalSeedToShelf,
  workFromLocalSeed,
  formatLocalSeedStamp,
  localSeedSavedAt,
  localSeedClosesAt,
  type LocalSeed,
} from "@/lib/local-seeds";
import { announcePublishedSeedToX, announceResultMessage } from "@/lib/announce-published-seed";
import { DashboardDirectRequestStatus } from "@/components/DashboardDirectRequestStatus";
import { ShareTextCopyButton } from "@/components/ShareTextCopyButton";
import { buildWorkShareText } from "@/lib/work-share-text";
import { buildCachedOutboundShareText } from "@/lib/outbound-invite-share";
import { displayAccountName, readLocalProfile } from "@/lib/local-profile";
import type { Work } from "@/data/dummy-works";
import { planBadgeLabel } from "@/data/dummy-works";

function SeedMetrics({ s }: { s: LocalSeed }) {
  return (
    <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-viscum-line pt-3 text-center">
      <div>
        <dt className="text-[10px] text-viscum-muted">閲覧</dt>
        <dd className="text-[15px] font-semibold text-viscum-ink">{s.viewCount}</dd>
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
  const savedAt = localSeedSavedAt(s);
  const closesAt = localSeedClosesAt(s);
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
      <p className="mt-1.5 space-y-0.5 text-[11px] tabular-nums leading-relaxed text-viscum-muted">
        <span className="block">
          作成 {formatLocalSeedStamp(s.createdAt)}
        </span>
        <span className="block">
          保存 {formatLocalSeedStamp(savedAt)}
        </span>
        {closesAt ? (
          <span className="block text-viscum-berry-deep">
            締切 {formatLocalSeedStamp(closesAt.toISOString())}
          </span>
        ) : null}
      </p>
      <SeedMetrics s={s} />
    </>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [seeds, setSeeds] = useState<LocalSeed[]>([]);
  const [neonWorks, setNeonWorks] = useState<Work[]>([]);
  const [demoOn, setDemoOn] = useState(false);
  const [origin, setOrigin] = useState("");

  function refresh() {
    const h = session?.user?.handle;
    setSeeds(readLocalSeeds());
    setDemoOn(h ? hasDemoSeeds(h) : false);
    if (session?.user?.id) {
      void fetch("/api/works?mine=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { works?: Work[] } | null) => {
          setNeonWorks(data?.works ?? []);
        })
        .catch(() => setNeonWorks([]));
    } else {
      setNeonWorks([]);
    }
  }

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.handle, session?.user?.id]);

  const mine = useMemo(() => {
    const h = session?.user?.handle;
    if (!h) return [];
    return seeds.filter((s) => s.seederHandle === h);
  }, [seeds, session?.user?.handle]);

  const neonDrafts = useMemo(
    () => neonWorks.filter((w) => w.listedOnShelf === false),
    [neonWorks],
  );
  const neonPublished = useMemo(
    () => neonWorks.filter((w) => w.listedOnShelf === true),
    [neonWorks],
  );

  const drafts = useMemo(
    () =>
      mine.filter(
        (s) =>
          isClientSeedId(s.id) &&
          !isDirectRequestLane(s) &&
          !isDemoSeed(s.id) &&
          !isLocalSeedListed(s),
      ),
    [mine],
  );
  const requestPacks = useMemo(
    () => mine.filter((s) => isDirectRequestLane(s)),
    [mine],
  );
  const published = useMemo(
    () =>
      mine.filter(
        (s) =>
          !isDirectRequestLane(s) &&
          (isDemoSeed(s.id) || isLocalSeedListed(s)),
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
  const fromLabel = handle
    ? displayAccountName(handle, readLocalProfile(handle))
    : "";

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
                href="#request-status"
                className="text-[13px] font-medium text-viscum-brand underline"
              >
                直依頼の進捗
              </a>
              <a
                href="#drafts"
                className="text-[13px] font-medium text-viscum-brand underline"
              >
                下書き
                {neonDrafts.length + drafts.length > 0
                  ? `（${neonDrafts.length + drafts.length}）`
                  : ""}
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

        {handle ? <DashboardDirectRequestStatus handle={handle} /> : null}

        <section id="drafts" className="scroll-mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-viscum-ink">
              下書き（未公開）
              {neonDrafts.length + drafts.length > 0 ? (
                <span className="ml-1.5 text-[13px] font-normal text-viscum-muted">
                  {neonDrafts.length + drafts.length}件
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
            ログイン中の新規シードはサーバ保存（共有可）。古い端末内下書きもここに残ります。
          </p>
          {neonDrafts.length === 0 && drafts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-viscum-line px-4 py-5 text-center">
              <p className="text-[13px] text-viscum-muted">下書きはありません。</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {neonDrafts.map((w) => (
                <li
                  key={w.id}
                  className="rounded-lg border border-viscum-line bg-white/50 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={w.status}
                      prizeYen={w.prizeYen}
                      planLabel={planBadgeLabel(w.plan)}
                      dense
                    />
                    <span className="rounded-full bg-viscum-leaf-soft px-2 py-0.5 text-[10px] font-medium text-viscum-leaf-deep">
                      サーバ
                    </span>
                    <span className="rounded-full bg-viscum-paper-2 px-2 py-0.5 text-[10px] font-medium text-viscum-muted">
                      下書き
                    </span>
                  </div>
                  <p className="mt-1.5 text-[14px] font-medium leading-snug text-viscum-ink line-clamp-2">
                    {w.title}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-viscum-line pt-2">
                    <button
                      type="button"
                      className="rounded-md bg-viscum-berry px-3 py-1.5 text-[12px] font-medium text-white hover:bg-viscum-berry-deep"
                      onClick={() => {
                        if (
                          !window.confirm(
                            "トップの「反応を募集中」に公開しますか？",
                          )
                        ) {
                          return;
                        }
                        void fetch(`/api/works/${encodeURIComponent(w.id)}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ listedOnShelf: true }),
                        }).then(async (res) => {
                          if (!res.ok) {
                            window.alert("公開に失敗しました");
                            return;
                          }
                          const data = (await res.json()) as { work?: Work };
                          if (data.work) {
                            void announcePublishedSeedToX(data.work).then(
                              (r) => {
                                const msg = announceResultMessage(r);
                                if (msg) window.alert(msg);
                                refresh();
                              },
                            );
                          } else refresh();
                        });
                      }}
                    >
                      公開する
                    </button>
                    {origin ? (
                      <ShareTextCopyButton
                        getText={() => buildWorkShareText(w, origin)}
                      />
                    ) : null}
                    <Link
                      href={`/w/${encodeURIComponent(w.id)}`}
                      className="rounded-md border border-viscum-brand px-3 py-1.5 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                    >
                      詳細
                    </Link>
                    <button
                      type="button"
                      className="rounded-md border border-viscum-berry/40 px-3 py-1.5 text-[12px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10"
                      onClick={() => {
                        if (!window.confirm("この下書きを削除しますか？")) {
                          return;
                        }
                        void fetch(`/api/works/${encodeURIComponent(w.id)}`, {
                          method: "DELETE",
                        }).then((res) => {
                          if (res.ok) refresh();
                          else window.alert("削除に失敗しました");
                        });
                      }}
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
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
                            "この端末のトップ表示に出します（他端末には見えません）。共有したいときはログインして新規シードしてください。",
                          )
                        ) {
                          return;
                        }
                        const row = publishLocalSeedToShelf(s.id);
                        if (row) {
                          refresh();
                        } else window.alert("公開に失敗しました");
                      }}
                    >
                      この端末だけで公開
                    </button>
                    <Link
                      href={`/w/${encodeURIComponent(s.id)}`}
                      className="rounded-md border border-viscum-brand px-3 py-1.5 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                    >
                      詳細
                    </Link>
                    <button
                      type="button"
                      className="rounded-md border border-viscum-berry/40 px-3 py-1.5 text-[12px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10"
                      onClick={() => {
                        if (
                            !window.confirm(
                              "この下書きを削除しますか？成績の数字も一緒に消えます。",
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

        <section id="direct-requests" className="scroll-mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-viscum-ink">
              直依頼メモ
              {requestPacks.length > 0 ? (
                <span className="ml-1.5 text-[13px] font-normal text-viscum-muted">
                  {requestPacks.length}件
                </span>
              ) : null}
            </h2>
            <Link
              href="/new/request"
              className="text-[13px] font-medium text-viscum-brand underline"
            >
              直依頼を作る
            </Link>
          </div>
          <p className="text-[11px] leading-relaxed text-viscum-muted">
            棚には出ない別ID（drq_）です。相手と金額の指定へ進めます。
          </p>
          {requestPacks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-viscum-line px-4 py-5 text-center">
              <p className="text-[13px] text-viscum-muted">まだありません。</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {requestPacks.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-viscum-line bg-white/50 px-3 py-3"
                >
                  <SeedCardChrome s={s} />
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-viscum-line pt-2">
                    <Link
                      href={`/w/${encodeURIComponent(s.id)}/request`}
                      className="rounded-md bg-viscum-berry px-3 py-1.5 text-[12px] font-medium text-white hover:bg-viscum-berry-deep"
                    >
                      直依頼を続ける
                    </Link>
                    {origin && handle ? (
                      <ShareTextCopyButton
                        label="案内文をコピー"
                        emptyHint="先に直依頼画面でリンクを確定してください"
                        getText={() =>
                          buildCachedOutboundShareText({
                            workId: s.id,
                            workTitle: s.title,
                            workExternalUrl: s.externalUrl,
                            focusNote: s.focusNote,
                            fromHandle: handle,
                            fromLabel,
                            origin,
                          })
                        }
                      />
                    ) : null}
                    <button
                      type="button"
                      className="rounded-md border border-viscum-berry/40 px-3 py-1.5 text-[12px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10"
                      onClick={() => {
                        if (!window.confirm("このメモを削除しますか？")) return;
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

          {neonPublished.length === 0 && published.length === 0 ? (
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
              {neonPublished.map((w) => (
                <li
                  key={w.id}
                  className="rounded-lg border border-viscum-line bg-white/50 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={w.status}
                      prizeYen={w.prizeYen}
                      planLabel={planBadgeLabel(w.plan)}
                      dense
                    />
                    <span className="rounded-full bg-viscum-leaf-soft px-2 py-0.5 text-[10px] font-medium text-viscum-leaf-deep">
                      サーバ・公開中
                    </span>
                  </div>
                  <p className="mt-1.5 text-[14px] font-medium leading-snug text-viscum-ink line-clamp-2">
                    {w.title}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-viscum-line pt-2">
                    {origin ? (
                      <ShareTextCopyButton
                        getText={() => buildWorkShareText(w, origin)}
                      />
                    ) : null}
                    <button
                      type="button"
                      className="rounded-md border border-viscum-line px-2.5 py-1 text-[12px] font-medium text-viscum-ink hover:bg-viscum-paper-2"
                      onClick={() => {
                        void fetch(`/api/works/${encodeURIComponent(w.id)}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ listedOnShelf: false }),
                        }).then((res) => {
                          if (res.ok) refresh();
                          else window.alert("下書きに戻せませんでした");
                        });
                      }}
                    >
                      下書きに戻す
                    </button>
                    <Link
                      href={`/w/${encodeURIComponent(w.id)}`}
                      className="rounded-md border border-viscum-brand px-2.5 py-1 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                    >
                      詳細
                    </Link>
                    <button
                      type="button"
                      className="rounded-md border border-viscum-berry/40 px-2.5 py-1 text-[12px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10"
                      onClick={() => {
                        if (
                          !window.confirm(
                            "このシードを削除しますか？トップからも消えます。",
                          )
                        ) {
                          return;
                        }
                        void fetch(`/api/works/${encodeURIComponent(w.id)}`, {
                          method: "DELETE",
                        }).then((res) => {
                          if (res.ok) refresh();
                          else window.alert("削除に失敗しました");
                        });
                      }}
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
              {published.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-viscum-line bg-white/50 px-3 py-3"
                >
                  <SeedCardChrome s={s} />
                  {s.id.startsWith("local_") && !isDemoSeed(s.id) ? (
                    <div className="mt-2 flex flex-wrap gap-2 border-t border-viscum-line pt-2">
                      <Link
                        href={`/dashboard/${encodeURIComponent(s.id)}`}
                        className="rounded-md border border-viscum-brand px-2.5 py-1 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                      >
                        成績を見る
                      </Link>
                      {origin ? (
                        <ShareTextCopyButton
                          getText={() =>
                            buildWorkShareText(workFromLocalSeed(s), origin)
                          }
                        />
                      ) : null}
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
                      <Link
                        href={`/w/${encodeURIComponent(s.id)}`}
                        className="rounded-md border border-viscum-brand px-2.5 py-1 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                      >
                        詳細
                      </Link>
                      <button
                        type="button"
                        className="rounded-md border border-viscum-berry/40 px-2.5 py-1 text-[12px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10"
                        onClick={() => {
                          if (
                            !window.confirm(
                              "このシードを削除しますか？成績の数字も一緒に消えます。",
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
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2 border-t border-viscum-line pt-2">
                      <Link
                        href={`/dashboard/${encodeURIComponent(s.id)}`}
                        className="rounded-md border border-viscum-brand px-2.5 py-1 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                      >
                        成績を見る
                      </Link>
                      {origin ? (
                        <ShareTextCopyButton
                          getText={() =>
                            buildWorkShareText(workFromLocalSeed(s), origin)
                          }
                        />
                      ) : null}
                      <Link
                        href={`/w/${encodeURIComponent(s.id)}`}
                        className="rounded-md border border-viscum-brand px-2.5 py-1 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                      >
                        詳細
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </BrowseChrome>
  );
}
