"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
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
import { FollowGraphList } from "@/components/FollowGraphList";
import { SuggestFollows } from "@/components/SuggestFollows";
import {
  countFollowers,
  countFollowing,
  FOLLOWS_UPDATED,
  listFollowers,
  listFollowing,
} from "@/lib/local-follows";

type GraphTab = "following" | "followers";

/** 公開PF頭：アカウント名が主、@英語IDは副。プロフィール文はその下 */
export function PortfolioHeader({
  handle,
  action,
}: {
  handle: string;
  action?: ReactNode;
}) {
  const { data: session } = useSession();
  const me = session?.user?.handle?.trim() || "";
  const demo = getDemoSeederProfile(handle);
  const [accountName, setAccountName] = useState(
    demo?.displayName ?? handle,
  );
  const [bio, setBio] = useState<string | null>(demo?.bio ?? null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [followingN, setFollowingN] = useState(0);
  const [followerN, setFollowerN] = useState(0);
  const [tab, setTab] = useState<GraphTab | null>(null);
  const [followingHandles, setFollowingHandles] = useState<string[]>([]);
  const [followerHandles, setFollowerHandles] = useState<string[]>([]);

  useEffect(() => {
    // デモ棚の人物像はローカル／Neonの実名で上書きしない（tori に mDB が乗る事故防止）
    if (demo) {
      setAccountName(demo.displayName);
      setBio(demo.bio);
      setAvatar(null);
      return;
    }

    let cancelled = false;
    const applyLocal = () => {
      const p = readLocalProfile(handle);
      const localName = p?.accountName?.trim();
      setAccountName(localName || handle);
      setBio(p?.bio?.trim() || null);
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
  }, [handle, demo?.handle]);

  useEffect(() => {
    const sync = () => {
      setFollowingN(countFollowing(handle));
      setFollowerN(countFollowers(handle));
      setFollowingHandles(listFollowing(handle));
      setFollowerHandles(listFollowers(handle));
    };
    sync();
    window.addEventListener(FOLLOWS_UPDATED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FOLLOWS_UPDATED, sync);
      window.removeEventListener("storage", sync);
    };
  }, [handle]);

  useEffect(() => {
    setTab(null);
  }, [handle]);

  const letter = demo?.glyph ?? accountName.slice(0, 1).toUpperCase();
  const toneClass = demo
    ? `${THUMB_TONE_CLASS[demo.thumbTone]} ${demo.thumbTone === "bark" ? "text-viscum-ink" : "text-white"}`
    : "bg-viscum-berry text-white";
  const loginCb = `/u/${encodeURIComponent(handle)}`;
  const isOwn =
    Boolean(me) &&
    me.replace(/^@/, "").toLowerCase() === handle.toLowerCase();

  function toggleTab(next: GraphTab) {
    setTab((cur) => (cur === next ? null : next));
  }

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
            <p className="mt-0.5 flex flex-wrap items-center gap-2 truncate text-[13px] text-viscum-muted">
              <span>@{handle}</span>
              {demo ? (
                <span className="shrink-0 rounded-full bg-viscum-line/70 px-2 py-0.5 text-[10px] font-medium text-viscum-muted">
                  デモアカウントです
                </span>
              ) : null}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0 pt-1">{action}</div> : null}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-viscum-ink">
        <button
          type="button"
          onClick={() => toggleTab("following")}
          className={`rounded-md px-1.5 py-0.5 text-left transition ${
            tab === "following"
              ? "bg-viscum-leaf-soft text-viscum-leaf-deep"
              : "hover:bg-viscum-paper-2"
          }`}
          aria-expanded={tab === "following"}
        >
          <span className="font-semibold tabular-nums">{followingN}</span>
          <span className="ml-1 text-viscum-muted">フォロー</span>
        </button>
        <button
          type="button"
          onClick={() => toggleTab("followers")}
          className={`rounded-md px-1.5 py-0.5 text-left transition ${
            tab === "followers"
              ? "bg-viscum-leaf-soft text-viscum-leaf-deep"
              : "hover:bg-viscum-paper-2"
          }`}
          aria-expanded={tab === "followers"}
        >
          <span className="font-semibold tabular-nums">{followerN}</span>
          <span className="ml-1 text-viscum-muted">フォロワー</span>
        </button>
      </p>

      {tab ? (
        <section className="mt-3 overflow-hidden rounded-lg border border-viscum-line bg-white/60">
          <div className="flex items-center justify-between border-b border-viscum-line px-3 py-2">
            <p className="text-[13px] font-medium text-viscum-ink">
              {tab === "following" ? "フォロー中" : "フォロワー"}
            </p>
            <button
              type="button"
              onClick={() => setTab(null)}
              className="text-[12px] text-viscum-muted underline"
            >
              閉じる
            </button>
          </div>
          <FollowGraphList
            handles={tab === "following" ? followingHandles : followerHandles}
            emptyText={
              tab === "following"
                ? "まだ誰もフォローしていません。"
                : "フォロワーはまだいません。"
            }
            loginCallbackUrl={loginCb}
          />
          {tab === "following" && isOwn && followingHandles.length === 0 ? (
            <div className="border-t border-viscum-line px-3 pb-3">
              <SuggestFollows
                title="おすすめ"
                limit={5}
                loginCallbackUrl={loginCb}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {bio ? (
        <div className="mt-3 text-[14px] leading-relaxed text-viscum-ink">
          <LinkifiedText text={bio} />
        </div>
      ) : null}
    </div>
  );
}
