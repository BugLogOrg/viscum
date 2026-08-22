"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Work } from "@/data/dummy-works";
import {
  formatCount,
  getWorkReactionCounts,
  planBadgeLabel,
} from "@/data/dummy-works";
import { SeederNameText } from "@/components/SeederNameText";
import {
  loadClientShelfWorks,
  rankHotOpenWorks,
} from "@/lib/hot-open-ranking";

/**
 * 作品詳細の右カラム想定。開催中をスキ減衰スコアで並べる。
 * 順位バッジは出さない（はてな型の「温まっている」感だけ）。
 */
export function HotOpenRail({
  excludeWorkId,
  className = "",
}: {
  excludeWorkId?: string;
  className?: string;
}) {
  const [items, setItems] = useState<Work[]>([]);

  useEffect(() => {
    const refresh = () => {
      setItems(
        rankHotOpenWorks(loadClientShelfWorks(), {
          excludeId: excludeWorkId,
        }),
      );
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "viscum_local_seeds_v1" ||
        e.key === "viscum_local_reactions_v1" ||
        e.key == null
      ) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, [excludeWorkId]);

  if (items.length === 0) return null;

  return (
    <aside
      className={`border-t border-viscum-line px-4 py-5 xl:sticky xl:top-14 xl:w-72 xl:shrink-0 xl:self-start xl:border-l xl:border-t-0 xl:py-4 ${className}`}
      aria-label="いま温まっている開催中"
    >
      <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
        いま温まっている開催中
      </h2>
      <p className="mt-1 text-[11px] leading-relaxed text-viscum-muted">
        スキと反応の勢い（仮の減衰並び）。信用スコアではありません。
      </p>
      <ul className="mt-3 divide-y divide-viscum-line">
        {items.map((w) => {
          const rx = getWorkReactionCounts(w);
          const plan = planBadgeLabel(w.plan);
          return (
            <li key={w.id}>
              <Link
                href={`/w/${w.id}`}
                className="block py-2.5 transition hover:bg-viscum-paper-2/80"
              >
                <p className="line-clamp-2 text-[13px] font-medium leading-snug text-viscum-ink">
                  {w.prizeYen != null && w.prizeYen > 0 ? (
                    <span className="mr-1.5 font-semibold tabular-nums text-viscum-berry">
                      褒賞：{w.prizeYen.toLocaleString("ja-JP")}円
                    </span>
                  ) : null}
                  {w.title}
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] text-viscum-muted">
                  <span>
                    <SeederNameText
                      handle={w.seeder}
                      preferredName={w.seederAccountName}
                    />
                  </span>
                  {plan ? <span>{plan}</span> : null}
                  <span>スキ {formatCount(rx.suki)}</span>
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[12px]">
        <Link
          href="/?feed=open"
          className="text-viscum-brand underline-offset-2 hover:underline"
        >
          開催中をすべて見る
        </Link>
      </p>
    </aside>
  );
}
