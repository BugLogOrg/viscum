"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FOLLOWS_UPDATED,
  isFollowing,
  setFollowing,
} from "@/lib/local-follows";

export function FollowButton({ handle }: { handle: string }) {
  const { data: session, status } = useSession();
  const me = session?.user?.handle?.trim() || "";
  const target = handle.replace(/^@/, "").trim();
  const self = me && me.toLowerCase() === target.toLowerCase();

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
    return () => {
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
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/u/${encodeURIComponent(target)}`)}`}
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
        const next = setFollowing(me, target, !following);
        setLocal(next);
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
