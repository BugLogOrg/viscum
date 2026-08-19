"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { formatYen } from "@/data/dummy-works";
import {
  readLocalSeeds,
  isDemoSeed,
  workDetailHref,
  type LocalSeed,
} from "@/lib/local-seeds";
import {
  formatDateJa,
  formatDelta,
  getReachSeries,
  periodTotals,
  todayDaily,
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

  const totals = useMemo(
    () => (series ? periodTotals(series.days) : null),
    [series],
  );
  const today = series ? todayDaily(series.days) : null;

  /** 表は新しい日が上（アナリティクス表っぽく） */
  const tableRows = useMemo(() => {
    if (!series) return [];
    return [...series.days].reverse();
  }, [series]);

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

        <section className="rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2 className="text-[14px] font-semibold text-viscum-ink">
                閲覧（日次）
              </h2>
              <p className="text-[11px] text-viscum-muted">
                直近14日 · YouTubeアナリティクス風
              </p>
            </div>
            {today && (
              <p className="text-right">
                <span className="block text-[10px] text-viscum-muted">今日</span>
                <span
                  className={`text-[15px] font-semibold tabular-nums ${
                    today.views > 0
                      ? "text-viscum-brand"
                      : "text-viscum-muted"
                  }`}
                >
                  {formatDelta(today.views)}
                </span>
              </p>
            )}
          </div>
          {series && (
            <div className="mt-3">
              <AnalyticsChart days={series.days} metric="views" />
            </div>
          )}
          {totals && (
            <p className="mt-2 border-t border-viscum-line pt-2 text-[12px] tabular-nums text-viscum-ink">
              期間合計{" "}
              <span className="text-[16px] font-semibold">{totals.views}</span>
              <span className="ml-2 text-viscum-muted">
                （生涯 {seed.viewCount}）
              </span>
            </p>
          )}
        </section>

        <section className="grid grid-cols-3 gap-2">
          {(
            [
              ["EMO", totals?.emo ?? 0, today?.emo ?? 0],
              ["気になる", totals?.bookmark ?? 0, today?.bookmark ?? 0],
              ["コメント", totals?.comment ?? 0, today?.comment ?? 0],
            ] as const
          ).map(([label, period, day]) => (
            <div
              key={label}
              className="rounded-lg border border-viscum-line bg-white/50 px-2 py-2.5 text-center"
            >
              <p className="text-[10px] text-viscum-muted">{label}</p>
              <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-viscum-ink">
                {period}
              </p>
              <p
                className={`text-[11px] font-medium tabular-nums ${
                  day > 0
                    ? "text-viscum-brand"
                    : day < 0
                      ? "text-viscum-berry"
                      : "text-viscum-muted"
                }`}
              >
                今日 {formatDelta(day)}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-viscum-line bg-white/70">
          <div className="border-b border-viscum-line px-3 py-2">
            <h2 className="text-[14px] font-semibold text-viscum-ink">
              日別の数字
            </h2>
            <p className="text-[11px] text-viscum-muted">
              新しい日が上 · タップした日付と対応
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-left text-[12px]">
              <thead>
                <tr className="bg-viscum-paper-2/80 text-[10px] text-viscum-muted">
                  <th className="px-2 py-2 font-medium">日付</th>
                  <th className="px-1 py-2 text-right font-medium tabular-nums">
                    閲覧
                  </th>
                  <th className="px-1 py-2 text-right font-medium tabular-nums">
                    EMO
                  </th>
                  <th className="px-1 py-2 text-right font-medium tabular-nums">
                    気になる
                  </th>
                  <th className="px-2 py-2 text-right font-medium tabular-nums">
                    コメント
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => {
                  const isToday =
                    today != null && row.date === today.date;
                  return (
                    <tr
                      key={row.date}
                      className={`border-t border-viscum-line ${
                        isToday ? "bg-viscum-leaf-soft/35" : ""
                      }`}
                    >
                      <td className="px-2 py-2 text-viscum-ink">
                        <span className="block text-[11px] leading-snug">
                          {formatDateJa(row.date)}
                        </span>
                      </td>
                      <td className="px-1 py-2 text-right tabular-nums font-medium text-viscum-ink">
                        {row.views}
                      </td>
                      <td className="px-1 py-2 text-right tabular-nums text-viscum-ink">
                        {row.emo}
                      </td>
                      <td className="px-1 py-2 text-right tabular-nums text-viscum-ink">
                        {row.bookmark}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-viscum-ink">
                        {row.comment}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="border-t-2 border-viscum-line bg-viscum-paper-2/60">
                    <td className="px-2 py-2 text-[11px] font-semibold text-viscum-ink">
                      期間合計
                    </td>
                    <td className="px-1 py-2 text-right text-[12px] font-semibold tabular-nums">
                      {totals.views}
                    </td>
                    <td className="px-1 py-2 text-right text-[12px] font-semibold tabular-nums">
                      {totals.emo}
                    </td>
                    <td className="px-1 py-2 text-right text-[12px] font-semibold tabular-nums">
                      {totals.bookmark}
                    </td>
                    <td className="px-2 py-2 text-right text-[12px] font-semibold tabular-nums">
                      {totals.comment}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        <p className="text-[11px] leading-relaxed text-viscum-muted">
          {isDemoSeed(seed.id)
            ? "表と折れ線は見た目確認用の仮データです。日付は端末の「今日」から逆算しています。"
            : seed.viewCount === 0
              ? "まだ届きの記録がありません。共有するとここに日次が増えます。"
              : "日次は仮の割り振りです。本物の日付ログはデータベース接続後です。"}
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
