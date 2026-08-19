"use client";

import { useEffect, useState, type ReactNode } from "react";
import { readLocalProfile } from "@/lib/local-profile";

/** 公開PF頭：アイコン＋@ハンドル、その下に一言 */
export function PortfolioHeader({
  handle,
  action,
}: {
  handle: string;
  action?: ReactNode;
}) {
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

  const letter = handle.slice(0, 1).toUpperCase();

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
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
              {letter}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-viscum-ink">
              @{handle}
            </h1>
            <p className="mt-0.5 text-[13px] text-viscum-muted">
              ポートフォリオ（デモ）
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0 pt-1">{action}</div> : null}
      </div>
      {bio ? (
        <p className="mt-3 text-[14px] leading-relaxed text-viscum-ink">{bio}</p>
      ) : null}
    </div>
  );
}
