"use client";

import { useEffect, useState } from "react";
import { readLocalProfile } from "@/lib/local-profile";

/** 公開ポートフォリオのアイコン＋一言（端末内プロフィール） */
export function PortfolioBio({ handle }: { handle: string }) {
  const [bio, setBio] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const p = readLocalProfile(handle);
      setBio(p?.bio?.trim() ? p.bio.trim() : null);
      setAvatar(p?.avatarDataUrl ?? null);
    };
    sync();
    window.addEventListener("viscum-profile-updated", sync);
    return () => window.removeEventListener("viscum-profile-updated", sync);
  }, [handle]);

  if (!bio && !avatar) return null;

  return (
    <div className="mt-3 flex items-start gap-3">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-viscum-berry text-lg font-semibold text-white"
          aria-hidden
        >
          {handle.slice(0, 1).toUpperCase()}
        </span>
      )}
      {bio ? (
        <p className="min-w-0 flex-1 pt-1 text-[14px] leading-relaxed text-viscum-ink">
          {bio}
        </p>
      ) : null}
    </div>
  );
}
