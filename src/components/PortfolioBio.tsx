"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  displayAccountName,
  fetchRemoteProfile,
  readLocalProfile,
  writeLocalProfile,
} from "@/lib/local-profile";

/** 公開PF頭：アカウント名が主、@英語IDは副。一言はその下 */
export function PortfolioHeader({
  handle,
  action,
}: {
  handle: string;
  action?: ReactNode;
}) {
  const [accountName, setAccountName] = useState(handle);
  const [bio, setBio] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const applyLocal = () => {
      const p = readLocalProfile(handle);
      setAccountName(displayAccountName(handle, p));
      setBio(p?.bio?.trim() ? p.bio.trim() : null);
      setAvatar(p?.avatarDataUrl ?? null);
    };
    applyLocal();
    void (async () => {
      const remote = await fetchRemoteProfile(handle);
      if (cancelled || !remote?.persisted) return;
      if (!remote.accountName && !remote.bio && !remote.image) return;
      setAccountName(remote.accountName?.trim() || handle);
      setBio(remote.bio?.trim() || null);
      setAvatar(remote.image);
      writeLocalProfile({
        handle,
        accountName: remote.accountName?.trim() || undefined,
        bio: remote.bio ?? "",
        avatarDataUrl: remote.image ?? undefined,
        updatedAt: new Date().toISOString(),
      });
      window.dispatchEvent(new Event("viscum-profile-updated"));
    })();
    const sync = () => applyLocal();
    window.addEventListener("viscum-profile-updated", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("viscum-profile-updated", sync);
    };
  }, [handle]);

  const letter = accountName.slice(0, 1).toUpperCase();

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
              {accountName}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-viscum-muted">
              @{handle}
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
