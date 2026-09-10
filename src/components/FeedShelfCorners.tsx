"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Work } from "@/data/dummy-works";
import {
  formatClosesIn,
  formatCount,
  getWorkReactionCounts,
  isWorkPinned,
  planBadgeLabel,
} from "@/data/dummy-works";
import { PIN_MAX_ACTIVE } from "@/lib/seeder-pricing";
import { SeederNameText } from "@/components/SeederNameText";
import { StatusBadge } from "@/components/StatusBadge";
import {
  loadClientShelfWorks,
  rankClosingSoonWorks,
  rankHotOpenWorks,
} from "@/lib/hot-open-ranking";
import { countCommentAttitudes } from "@/lib/protocol-colors";

/** 賛同(青)／止まれ(赤)の偏り＝偏差。表示は賛／止／別で合計を合わせる */
function rankSkewedWorks(
  works: Work[],
  opts?: { excludeId?: string; limit?: number },
): {
  work: Work;
  lean: "blue" | "red";
  green: number;
  blue: number;
  red: number;
}[] {
  const limit = opts?.limit ?? 5;
  const scored = works
    .filter((w) => w.status === "open" && w.id !== opts?.excludeId)
    .map((w) => {
      const c = countCommentAttitudes(w.comments ?? []);
      const green = c.green;
      const blue = c.blue;
      const red = c.red;
      const duel = blue + red;
      if (duel < 2) return null;
      const skew = Math.abs(blue - red) / duel;
      if (skew < 0.25) return null;
      const lean: "blue" | "red" = blue >= red ? "blue" : "red";
      const score = skew * Math.log(1 + duel);
      return { work: w, lean, green, blue, red, score };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map(({ work, lean, green, blue, red }) => ({
    work,
    lean,
    green,
    blue,
    red,
  }));
}

function CompactWorkLink({
  work,
  skewHint,
  isCurrent = false,
}: {
  work: Work;
  skewHint?: {
    lean: "blue" | "red";
    green: number;
    blue: number;
    red: number;
  };
  /** いま開いている作品（同じURLなので遷移しない → 先頭へ戻して反応を返す） */
  isCurrent?: boolean;
}) {
  const rx = getWorkReactionCounts(work);
  const countdown = formatClosesIn(work.closesInHours, work.status);
  const commentN = work.comments?.length ?? 0;
  return (
    <Link
      href={`/w/${work.id}`}
      className="block min-w-0 py-2 transition hover:bg-viscum-paper-2/80"
      aria-current={isCurrent ? "page" : undefined}
      onClick={
        isCurrent
          ? (e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          : undefined
      }
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {isCurrent ? (
          <span className="shrink-0 rounded-sm border border-viscum-line px-1 text-[10px] font-medium text-viscum-muted">
            いま見ている
          </span>
        ) : null}
        {work.status === "open" || work.status === "pay_soon" ? (
          <StatusBadge
            status={work.status}
            prizeYen={work.prizeYen}
            paymentsDone={work.paymentsDone}
            planLabel={planBadgeLabel(work.plan)}
            dense
            className="max-w-full whitespace-normal break-words"
          />
        ) : null}
        {countdown ? (
          <span className="shrink-0 text-[11px] font-medium text-viscum-berry-deep">
            {countdown}
          </span>
        ) : null}
        {skewHint ? (
          <span
            className={`text-[10px] font-medium ${
              skewHint.lean === "blue"
                ? "text-viscum-protocol-blue"
                : "text-viscum-protocol-red"
            }`}
          >
            {skewHint.lean === "blue" ? "賛同寄り" : "止まれ寄り"} · 賛
            {skewHint.blue}／止{skewHint.red}／別{skewHint.green}
          </span>
        ) : null}
      </div>
      <p className="mt-1 line-clamp-3 break-words text-[13px] font-medium leading-snug text-viscum-ink">
        {work.title}
      </p>
      <p className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 text-[11px] text-viscum-muted">
        <span className="min-w-0 truncate">
          <SeederNameText
            handle={work.seeder}
            preferredName={work.seederAccountName}
          />
        </span>
        <span className="shrink-0">気になる {formatCount(rx.bookmark)}</span>
        <span className="shrink-0">コメント {formatCount(commentN)}</span>
      </p>
    </Link>
  );
}

/** ピン枠（ADR-069）。開催中かつ期限内。期限が近い順（＝先に買った順に近い） */
function rankPinnedWorks(works: Work[], opts?: { excludeId?: string }): Work[] {
  const now = Date.now();
  return works
    .filter((w) => w.id !== opts?.excludeId && isWorkPinned(w, now))
    .slice()
    .sort((a, b) => Date.parse(a.pinnedUntilIso!) - Date.parse(b.pinnedUntilIso!))
    .slice(0, PIN_MAX_ACTIVE);
}

/**
 * ピン枠。独立枠（注目に混ぜない）。「広告／PR／スポンサー」の語は使わず
 * 「ピン」＋小さく「有料掲載」で有料と分かる表示にする。
 */
function PinSection({
  pinned,
  currentId,
  className = "",
}: {
  pinned: Work[];
  currentId?: string;
  className?: string;
}) {
  if (pinned.length === 0) return null;
  return (
    <section className={className} aria-label="ピン（有料掲載）">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-bold leading-tight tracking-wide text-viscum-brand">
          ピン
          <span className="ml-1.5 align-middle text-[10px] font-medium tracking-normal text-viscum-muted">
            有料掲載
          </span>
        </h2>
        <Link
          href="/faq#pin"
          className="shrink-0 text-[12px] font-medium text-viscum-brand underline-offset-2 hover:underline"
        >
          ピンとは
        </Link>
      </div>
      <p className="mt-1.5 text-[12px] leading-snug break-words text-viscum-muted">
        シーダーが出している開催中コンペ（1週）
      </p>
      <ul className="mt-2 divide-y divide-viscum-line">
        {pinned.map((w) => (
          <li key={w.id}>
            <CompactWorkLink work={w} isCurrent={w.id === currentId} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** ピンが0本のとき：空箱を出さず1行だけ */
function PinEmptyLine({
  free,
  className = "",
}: {
  free: number;
  className?: string;
}) {
  return (
    <p className={`text-[12px] leading-snug text-viscum-muted ${className}`}>
      <Link
        href="/faq#pin"
        className="font-medium text-viscum-brand underline-offset-2 hover:underline"
      >
        ピン枠（{free > 0 ? `空き${free}` : "満席"}）
      </Link>
      <span className="ml-1">— 開催中コンペを上に出す</span>
    </p>
  );
}

function HotSection({
  hot,
  className = "",
}: {
  hot: Work[];
  className?: string;
}) {
  if (hot.length === 0) return null;
  return (
    <section className={className} aria-label="注目の反応募集">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-bold leading-tight tracking-wide text-viscum-brand">
          注目の反応募集
        </h2>
        <Link
          href="/?feed=open"
          className="shrink-0 text-[12px] font-medium text-viscum-brand underline-offset-2 hover:underline"
        >
          反応募集中へ
        </Link>
      </div>
      <p className="mt-1.5 text-[12px] leading-snug break-words text-viscum-muted">
        反応が集まっている募集中
      </p>
      <ul className="mt-2 divide-y divide-viscum-line">
        {hot.map((w) => (
          <li key={w.id}>
            <CompactWorkLink work={w} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClosingSoonSection({
  closing,
  className = "",
}: {
  closing: Work[];
  className?: string;
}) {
  if (closing.length === 0) return null;
  return (
    <section className={className} aria-label="終了間近">
      <h2 className="text-[18px] font-bold leading-tight tracking-wide text-viscum-brand">
        終了間近
      </h2>
      <p className="mt-1.5 text-[12px] leading-snug break-words text-viscum-muted">
        あと少しで締切。いまなら間に合う
      </p>
      <ul className="mt-2 divide-y divide-viscum-line">
        {closing.map((w) => (
          <li key={w.id}>
            <CompactWorkLink work={w} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkewSection({
  skewed,
  className = "",
}: {
  skewed: ReturnType<typeof rankSkewedWorks>;
  className?: string;
}) {
  if (skewed.length === 0) return null;
  return (
    <section className={className} aria-label="偏差">
      <h2 className="text-[18px] font-bold leading-tight tracking-wide text-viscum-brand">
        偏差
      </h2>
      <p className="mt-1.5 text-[12px] leading-snug break-words text-viscum-muted">
        賛同／止まれに寄っている反応募集。逆張りの余地
      </p>
      <ul className="mt-2 divide-y divide-viscum-line">
        {skewed.map(({ work, lean, green, blue, red }) => (
          <li key={work.id}>
            <CompactWorkLink
              work={work}
              skewHint={{ lean, green, blue, red }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 発見コーナー（ピン → 注目 → 終了間近 → 偏差）。ADR-069。
 * - bottom: TOP用。ピンあり＝2×2（左上ピン｜右上終了間近／左下注目｜右下偏差）。
 *           ピン0本＝1行リンク＋横3枠（注目｜終了間近｜偏差）。携帯は縦積み
 * - sideDuo: 詳細用。内側右＝ピン→注目／外側右＝終了間近→偏差（TOP 2×2 と同じ並び）。携帯は縦にピン→注目→終了→偏差
 */
function mergeNeonAndLocal(neon: Work[], local: Work[]): Work[] {
  const neonIds = new Set(neon.map((w) => w.id));
  return [...neon, ...local.filter((w) => !neonIds.has(w.id))];
}

export function FeedShelfCorners({
  works: worksProp,
  initialWorks,
  excludeWorkId,
  layout = "bottom",
  className = "",
}: {
  /** 棚そのもの（TOP）。渡されたら fetch しない */
  works?: Work[];
  /**
   * サーバーで読んだ公開中 Neon 作品（詳細ページ）。最初の描画からピン・注目を正しく出す。
   * 無いときは fetch が返るまで何も描かない（「空き3→2」のような数字のブレを見せない）
   */
  initialWorks?: Work[];
  excludeWorkId?: string;
  layout?: "bottom" | "sideDuo";
  className?: string;
}) {
  const [localShelf, setLocalShelf] = useState<Work[]>(
    () => initialWorks ?? [],
  );

  useEffect(() => {
    if (worksProp) return;
    let cancelled = false;
    const refresh = () => {
      const local = loadClientShelfWorks();
      void fetch("/api/works?listed=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { works?: Work[] } | null) => {
          if (cancelled) return;
          const neon = data?.works ?? initialWorks ?? [];
          setLocalShelf(mergeNeonAndLocal(neon, local));
        })
        .catch(() => {
          if (!cancelled) setLocalShelf(mergeNeonAndLocal(initialWorks ?? [], local));
        });
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [worksProp, initialWorks]);

  const works = worksProp ?? localShelf;

  // ピン枠は「いま見ている作品」も除外しない（有料で出したものが自分の画面で見えないのは不自然。mDB 2026-09-10）
  const pinnedAll = useMemo(() => rankPinnedWorks(works), [works]);
  const pinned = pinnedAll;
  const pinnedIds = useMemo(() => new Set(pinnedAll.map((w) => w.id)), [pinnedAll]);
  const pinFree = Math.max(0, PIN_MAX_ACTIVE - pinnedAll.length);

  // 注目はピンと被らせない（有料で出ている分は自然枠から外す）
  const hot = useMemo(
    () =>
      rankHotOpenWorks(works, { excludeId: excludeWorkId, limit: 5 + pinnedAll.length })
        .filter((w) => !pinnedIds.has(w.id))
        .slice(0, 5),
    [works, excludeWorkId, pinnedAll.length, pinnedIds],
  );

  const closing = useMemo(
    () =>
      rankClosingSoonWorks(works, {
        excludeId: excludeWorkId,
        excludeIds: [...hot.map((w) => w.id), ...pinnedIds],
        limit: 5,
      }),
    [works, excludeWorkId, hot, pinnedIds],
  );

  // 偏差は「いま見ている作品」も候補に残す（除外するとTOPと件数がズレる）
  // ただしリスト先頭で自分自身は出さない
  const skewed = useMemo(() => {
    const all = rankSkewedWorks(works, { limit: 6 });
    if (!excludeWorkId) return all.slice(0, 5);
    const without = all.filter((x) => x.work.id !== excludeWorkId);
    return without.slice(0, 5);
  }, [works, excludeWorkId]);

  if (
    pinned.length === 0 &&
    hot.length === 0 &&
    closing.length === 0 &&
    skewed.length === 0
  ) {
    return null;
  }

  if (layout === "sideDuo") {
    return (
      <aside
        className={`flex w-full min-w-0 flex-col border-t border-viscum-line bg-viscum-paper-2/30 xl:min-w-0 xl:flex-1 xl:flex-row xl:self-stretch xl:border-l xl:border-t-0 ${className}`}
        aria-label="発見"
      >
        {/* 内側右（携帯では上）：ピン → 注目。TOP 2×2 の左列と同じ */}
        <div className="min-w-0 xl:sticky xl:top-12 xl:flex-1 xl:basis-0 xl:border-r xl:border-viscum-line">
          {pinned.length > 0 ? (
            <PinSection
              pinned={pinned}
              currentId={excludeWorkId}
              className="min-w-0 px-2.5 py-3 xl:px-3"
            />
          ) : (
            <PinEmptyLine free={pinFree} className="px-2.5 pt-3 xl:px-3" />
          )}
          <HotSection
            hot={hot}
            className={`min-w-0 px-2.5 py-3 xl:px-3 ${
              pinned.length > 0 ? "border-t border-viscum-line" : ""
            }`}
          />
        </div>
        {/* 外側右（携帯では下）：終了間近 → 偏差。TOP 2×2 の右列と同じ */}
        <div className="min-w-0 border-t border-viscum-line xl:sticky xl:top-12 xl:flex-1 xl:basis-0 xl:border-t-0">
          <ClosingSoonSection
            closing={closing}
            className="min-w-0 px-2.5 py-3 xl:px-3"
          />
          <SkewSection
            skewed={skewed}
            className={`min-w-0 px-2.5 py-3 xl:px-3 ${
              closing.length > 0 ? "border-t border-viscum-line" : ""
            }`}
          />
        </div>
      </aside>
    );
  }

  if (pinned.length > 0) {
    // TOP・ピンあり: 2×2（左上ピン｜右上終了間近／左下注目｜右下偏差）。携帯は縦：ピン→注目→終了→偏差
    return (
      <aside
        className={`min-w-0 overflow-hidden border-t border-viscum-line bg-viscum-paper-2/25 ${className}`}
        aria-label="発見"
      >
        <div className="grid min-w-0 gap-0 md:grid-cols-2">
          <PinSection
            pinned={pinned}
            className="order-1 min-w-0 border-b border-viscum-line px-4 py-4 md:border-r"
          />
          <ClosingSoonSection
            closing={closing}
            className="order-3 min-w-0 border-b border-viscum-line px-4 py-4 md:order-2"
          />
          <HotSection
            hot={hot}
            className="order-2 min-w-0 border-b border-viscum-line px-4 py-4 md:order-3 md:border-b-0 md:border-r"
          />
          <SkewSection
            skewed={skewed}
            className="order-4 min-w-0 px-4 py-4"
          />
        </div>
      </aside>
    );
  }

  // TOP・ピン0本: 1行リンク＋横3枠（注目｜終了間近｜偏差）。注目が上に詰まる
  return (
    <aside
      className={`min-w-0 overflow-hidden border-t border-viscum-line bg-viscum-paper-2/25 ${className}`}
      aria-label="発見"
    >
      <PinEmptyLine free={pinFree} className="border-b border-viscum-line px-4 py-2" />
      <div className="grid min-w-0 gap-0 md:grid-cols-3 md:divide-x md:divide-viscum-line">
        <HotSection
          hot={hot}
          className="min-w-0 border-b border-viscum-line px-4 py-4 md:border-b-0"
        />
        <ClosingSoonSection
          closing={closing}
          className="min-w-0 border-b border-viscum-line px-4 py-4 md:border-b-0"
        />
        <SkewSection skewed={skewed} className="min-w-0 px-4 py-4" />
      </div>
    </aside>
  );
}
