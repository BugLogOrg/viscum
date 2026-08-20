"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FOLLOWS_UPDATED,
  listFollowing,
} from "@/lib/local-follows";
import {
  getSuggestedSeeders,
  THUMB_TONE_CLASS,
} from "@/data/suggested-seeders";
import { FollowButton } from "@/components/FollowButton";

/** デモ棚の色タイル付きでユーザーをおすすめ（フォロー中が空でも寂しくない） */
export function SuggestFollows({
  title = "まずはこの人をフォロー",
  limit = 5,
  /** 未ログイン時の戻り先（連続フォロー用に一覧へ戻す） */
  loginCallbackUrl = "/?feed=follow",
}: {
  title?: string;
  limit?: number;
  loginCallbackUrl?: string;
}) {
  const { data: session } = useSession();
  const me = session?.user?.handle?.trim() || "";
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setFollowing(me ? listFollowing(me) : []);
    sync();
    window.addEventListener(FOLLOWS_UPDATED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FOLLOWS_UPDATED, sync);
      window.removeEventListener("storage", sync);
    };
  }, [me]);

  const followSet = new Set(following.map((h) => h.toLowerCase()));
  const meKey = me.toLowerCase();
  // フォロー済みも消さず残す（ボタンが「フォロー中」になる）
  const list = getSuggestedSeeders(limit)
    .filter((s) => s.handle.toLowerCase() !== meKey)
    .slice(0, limit);

  if (list.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-viscum-ink">{title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-viscum-muted">
        いまはデモ棚のユーザーです。何人でもフォローできます（この場に留まります）。押すと「フォロー中」に変わります。
      </p>
      <ul className="mt-4 divide-y divide-viscum-line overflow-hidden rounded-lg border border-viscum-line bg-white/50">
        {list.map((s) => {
          const isFollowed = followSet.has(s.handle.toLowerCase());
          return (
          <li
            key={s.handle}
            className={`flex items-center gap-2 px-3 py-2.5 ${isFollowed ? "bg-viscum-paper-2/40" : ""}`}
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
            <FollowButton
              handle={s.handle}
              loginCallbackUrl={loginCallbackUrl}
            />
          </li>
          );
        })}
      </ul>
    </section>
  );
}
