"use client";

import { useState } from "react";
import { isDemoFollowing } from "@/data/demo-follows";

export function FollowButton({ handle }: { handle: string }) {
  const [following, setFollowing] = useState(() => isDemoFollowing(handle));

  return (
    <button
      type="button"
      onClick={() => {
        setFollowing((v) => {
          const next = !v;
          window.alert(
            next
              ? `【デモ】@${handle} をフォローしました。\n「フォロー中」に作品が並びます（このデモでは再読込で初期状態に戻ります）。`
              : `【デモ】@${handle} のフォローを解除しました。`,
          );
          return next;
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
