"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Sparkline } from "@/components/Sparkline";
import { formatYen } from "@/data/dummy-works";
import {
  readLocalSeeds,
  isDemoSeed,
  workDetailHref,
  type LocalSeed,
} from "@/lib/local-seeds";
import {
  dayDelta,
  formatDelta,
  getReachSeries,
} from "@/lib/reach-series";

export default function SeedStatsPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeURIComponent(rawId ?? "");
  const { data: session, status } = useSession();
  const [seed, setSeed] = useState<LocalSeed | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setSeed(null);
      return;
    }
    const found = readLocalSeeds().find((s) => s.id === id) ?? null;
    setSeed(found);
  }, [id]);

  const series = useMemo(
    () => (seed ? getReachSeries(seed) : null),
    [seed],
  );

  if (status === "loading" || seed === undefined) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper px-4 py-10 text-sm text-viscum-muted">
        読み込み中…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
        <SiteHeader backHref="/me" />
        <main className="px-4 py-10">
          <p className="text-[14px] text-viscum-muted">
            成績シートはログイン後に見られます。
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex text-sm font-medium text-viscum-brand underline"
          >
            ログインへ
          </Link>
        </main>
      </div>
    );
  }

  if (!seed || seed.seederHandle !== session.user.handle) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
        <SiteHeader backHref="/me" />
        <main className="px-4 py-10">
          <p className="text-[14px] text-viscum-muted">
            このシードの成績が見つかりません。
          </p>
          <Link
            href="/me"
            className="mt-4 inline-flex text-sm font-medium text-viscum-brand underline"
          >
            マイシードへ
          </Link>
        </main>
      </div>
    );
  }

  const detailHref = workDetailHref(seed);
  const viewDelta = series ? dayDelta(series.views) : 0;
  const emoDelta = series ? dayDelta(series.emo) : 0;
  const bookmarkDelta = series ? dayDelta(series.bookmark) : 0;
  const commentDelta = series ? dayDelta(series.comment) : 0;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/me" hidePostCta />
      <main className="space-y-6 px-4 py-6">
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-wide text-viscum-muted">
            成績シート
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={seed.status}
              prizeYen={seed.prizeYen}
              dense
            />
            {isDemoSeed(seed.id) && (
              <span className="rounded-full bg-viscum-paper-2 px-2 py-0.5 text-[10px] font-medium text-viscum-muted">
                表示デモ
              </span>
            )}
            {seed.prizeYen != null && seed.status === "open" && (
              <span className="text-[11px] text-viscum-muted">
                チップ {formatYen(seed.prizeYen)}
              </span>
            )}
          </div>
          <h1 className="text-[17px] font-semibold leading-snug text-viscum-ink">
            {seed.title}
          </h1>
        </div>

        <section className="rounded-lg border border-viscum-line bg-white/60 px-3 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[14px] font-semibold text-viscum-ink">
              閲覧の推移
            </h2>
            <p
              className={`text-[13px] font-semibold tabular-nums ${
                viewDelta > 0
                  ? "text-viscum-brand"
                  : viewDelta < 0
                    ? "text-viscum-berry"
                    : "text-viscum-muted"
              }`}
            >
              今日 {formatDelta(viewDelta)}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] text-viscum-muted">直近7日・累計</p>
          {series && <Sparkline values={series.views} className="mt-2" />}
          <p className="mt-1 text-right text-[12px] tabular-nums text-viscum-ink">
            いま{" "}
            <span className="text-[18px] font-semibold">{seed.viewCount}</span>
          </p>
        </section>

        <section className="grid grid-cols-3 gap-2">
          {(
            [
              ["EMO", seed.emoCount, emoDelta],
              ["気になる", seed.bookmarkCount, bookmarkDelta],
              ["コメント", seed.commentCount, commentDelta],
            ] as const
          ).map(([label, total, delta]) => (
            <div
              key={label}
              className="rounded-lg border border-viscum-line bg-white/50 px-2 py-2.5 text-center"
            >
              <p className="text-[10px] text-viscum-muted">{label}</p>
              <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-viscum-ink">
                {total}
              </p>
              <p
                className={`text-[11px] font-medium tabular-nums ${
                  delta > 0
                    ? "text-viscum-brand"
                    : delta < 0
                      ? "text-viscum-berry"
                      : "text-viscum-muted"
                }`}
              >
                今日 {formatDelta(delta)}
              </p>
            </div>
          ))}
        </section>

        {series && (seed.emoCount > 0 || isDemoSeed(seed.id)) && (
          <section className="rounded-lg border border-viscum-line bg-white/40 px-3 py-3">
            <h2 className="text-[13px] font-semibold text-viscum-ink">
              EMOの推移
            </h2>
            <Sparkline
              values={series.emo}
              className="mt-1"
              heightClass="h-16"
              stroke="var(--viscum-berry)"
              fill="color-mix(in srgb, var(--viscum-berry-soft) 35%, transparent)"
            />
          </section>
        )}

        <p className="text-[11px] leading-relaxed text-viscum-muted">
          {isDemoSeed(seed.id)
            ? "折れ線は見た目確認用の仮データです。データベース接続後に本物の日次推移へ差し替えます。"
            : seed.viewCount === 0
              ? "まだ届きの記録がありません。共有するとここに増減が乗ります。"
              : "推移は仮の曲線です。日ごとの本物の増減はデータベース接続後です。"}
        </p>

        <div className="space-y-2 pb-8">
          {detailHref ? (
            <Link
              href={detailHref}
              className="flex w-full items-center justify-center rounded-md bg-viscum-berry px-4 py-3 text-sm font-medium text-white hover:bg-viscum-berry-deep"
            >
              作品の詳細を見る
            </Link>
          ) : (
            <p className="rounded-md border border-dashed border-viscum-line px-3 py-3 text-center text-[12px] text-viscum-muted">
              作品詳細はまだ接続前です（シード控えのみ）。
            </p>
          )}
          <Link
            href="/me"
            className="flex w-full items-center justify-center py-2 text-[13px] text-viscum-brand underline"
          >
            マイシード一覧へ
          </Link>
        </div>
      </main>
    </div>
  );
}
