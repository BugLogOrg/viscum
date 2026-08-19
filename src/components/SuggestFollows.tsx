"use client";

import Link from "next/link";
import {
  getSuggestedSeeders,
  THUMB_TONE_CLASS,
} from "@/data/suggested-seeders";
import { FollowButton } from "@/components/FollowButton";

/** デモ棚の色タイル付きでシーダーをおすすめ（フォロー中が空でも寂しくない） */
export function SuggestFollows({
  title = "まずはこの人をフォロー",
  limit = 5,
}: {
  title?: string;
  limit?: number;
}) {
  const list = getSuggestedSeeders(limit);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-viscum-ink">{title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-viscum-muted">
        いまはデモ棚のシーダーです。フォローすると「フォロー中」に作品が並びます。
      </p>
      <ul className="mt-4 divide-y divide-viscum-line overflow-hidden rounded-lg border border-viscum-line bg-white/50">
        {list.map((s) => (
          <li
            key={s.handle}
            className="flex items-center gap-3 px-3 py-2.5"
          >
            <Link
              href={`/u/${encodeURIComponent(s.handle)}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white/90 ${THUMB_TONE_CLASS[s.thumbTone]}`}
                aria-hidden
              >
                {s.glyph}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium text-viscum-ink">
                  @{s.handle}
                </span>
                <span className="block truncate text-[11px] text-viscum-muted">
                  {s.blurb} · 作品{s.workCount}
                </span>
              </span>
            </Link>
            <FollowButton handle={s.handle} />
          </li>
        ))}
      </ul>
    </section>
  );
}
