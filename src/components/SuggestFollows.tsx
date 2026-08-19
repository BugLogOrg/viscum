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
            className="flex items-center gap-2 px-3 py-2.5"
          >
            <Link
              href={`/u/${encodeURIComponent(s.handle)}`}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${THUMB_TONE_CLASS[s.thumbTone]} ${s.thumbTone === "bark" ? "text-viscum-ink" : "text-white"}`}
                aria-hidden
              >
                {s.glyph}
              </span>
              <span className="min-w-0">
                <span className="flex min-w-0 items-baseline gap-1.5">
                  <span className="truncate text-[14px] font-medium text-viscum-ink">
                    {s.displayName}
                  </span>
                  <span className="shrink-0 text-[12px] text-viscum-muted">
                    @{s.handle}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-viscum-muted">
                  {s.bio}
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
