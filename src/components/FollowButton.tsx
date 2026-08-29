"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FOLLOWS_UPDATED,
  isFollowing,
  setFollowing,
} from "@/lib/local-follows";

export function FollowButton({
  handle,
  loginCallbackUrl,
}: {
  handle: string;
  /** 未ログイン時。未指定なら公開PFへ戻す */
  loginCallbackUrl?: string;
}) {
  const { data: session, status } = useSession();
  const me = (session?.user?.handle ?? "").replace(/^@/, "").trim();
  const target = handle.replace(/^@/, "").trim();
  const self =
    Boolean(me) && me.toLowerCase() === target.toLowerCase();

  const [following, setLocal] = useState(false);

  useEffect(() => {
    if (!me) {
      setLocal(false);
      return;
    }
    const sync = () => setLocal(isFollowing(me, target));
    sync();
    window.addEventListener(FOLLOWS_UPDATED, sync);
    window.addEventListener("storage", sync);

    let cancelled = false;
    void fetch(`/api/follows?handle=${encodeURIComponent(target)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: { meFollowing?: boolean; persisted?: boolean } | null) => {
          if (cancelled || !data || typeof data.meFollowing !== "boolean") {
            return;
          }
          setLocal(data.meFollowing);
          if (data.meFollowing) setFollowing(me, target, true);
        },
      )
      .catch(() => {
        /* 端末グラフのまま */
      });

    return () => {
      cancelled = true;
      window.removeEventListener(FOLLOWS_UPDATED, sync);
      window.removeEventListener("storage", sync);
    };
  }, [me, target]);

  if (status === "loading") {
    return (
      <span className="rounded-md border border-viscum-line px-3 py-1.5 text-[13px] text-viscum-muted">
        …
      </span>
    );
  }

  if (!me) {
    const back =
      loginCallbackUrl ?? `/u/${encodeURIComponent(target)}`;
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(back)}`}
        className="rounded-md bg-viscum-berry px-3 py-1.5 text-[13px] font-medium text-white hover:bg-viscum-berry-deep"
      >
        フォロー
      </Link>
    );
  }

  if (self) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        const next = !following;
        setLocal(next);
        setFollowing(me, target, next);
        void fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: target, following: next }),
        }).catch(() => {
          /* デモ人物などは端末内のみで足りる */
        });
      }}
      className={
        following
          ? "rounded-md border border-viscum-line bg-viscum-paper px-3 py-1.5 text-[13px] font-medium text-viscum-muted hover:bg-viscum-paper-2"
          : "rounded-md bg-viscum-berry px-3 py-1.5 text-[13px] font-medium text-white hover:bg-viscum-berry-deep"
      }
      aria-pressed={following}
    >
      {following ? "フォロー中" : "フォロー"}
    </button>
  );
}
