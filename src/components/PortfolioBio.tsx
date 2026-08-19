"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  fetchRemoteProfile,
  readLocalProfile,
  writeLocalProfile,
} from "@/lib/local-profile";
import {
  getDemoSeederProfile,
  THUMB_TONE_CLASS,
} from "@/data/suggested-seeders";
import { LinkifiedText } from "@/components/LinkifiedText";

/** 公開PF頭：アカウント名が主、@英語IDは副。一言はその下 */
export function PortfolioHeader({
  handle,
  action,
}: {
  handle: string;
  action?: ReactNode;
}) {
  const demo = getDemoSeederProfile(handle);
  const [accountName, setAccountName] = useState(
    demo?.displayName ?? handle,
  );
  const [bio, setBio] = useState<string | null>(demo?.bio ?? null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const applyLocal = () => {
      const p = readLocalProfile(handle);
      const seed = getDemoSeederProfile(handle);
      const localName = p?.accountName?.trim();
      setAccountName(localName || seed?.displayName || handle);
      setBio(p?.bio?.trim() || seed?.bio || null);
      setAvatar(p?.avatarDataUrl ?? null);
    };
    applyLocal();
    void (async () => {
      const remote = await fetchRemoteProfile(handle);
      if (cancelled || !remote?.persisted) return;
      if (!remote.accountName && !remote.bio && !remote.image) return;
      const seed = getDemoSeederProfile(handle);
      setAccountName(
        remote.accountName?.trim() || seed?.displayName || handle,
      );
      setBio(remote.bio?.trim() || seed?.bio || null);
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

  const seed = getDemoSeederProfile(handle);
  const letter = seed?.glyph ?? accountName.slice(0, 1).toUpperCase();
  const toneClass = seed
    ? `${THUMB_TONE_CLASS[seed.thumbTone]} ${seed.thumbTone === "bark" ? "text-viscum-ink" : "text-white"}`
    : "bg-viscum-berry text-white";

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
              className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${toneClass}`}
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
        <div className="mt-3 text-[14px] leading-relaxed text-viscum-ink">
          <LinkifiedText text={bio} />
        </div>
      ) : null}
    </div>
  );
}
