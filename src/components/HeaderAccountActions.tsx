"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  clearDemoNotifies,
} from "@/lib/local-notifies";
import { fetchRemoteNotifies } from "@/lib/remote-notifies";
import {
  displayAccountName,
  readAvatarDataUrl,
  readLocalProfile,
} from "@/lib/local-profile";
import { fetchMyRequests } from "@/lib/remote-requests";

/** ベル＝通知。アカウントメニュー＝ダッシュ／設定／気になる */
export function HeaderAccountActions({
  className = "",
}: {
  className?: string;
  /** @deprecated 未読は local notifies から計算 */
  notifyDot?: boolean;
}) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pendingDm, setPendingDm] = useState(0);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const handle = session?.user?.handle?.trim() || "";
  const isDemoSession = Boolean(session?.user?.id?.startsWith("demo:"));
  const isLoggedIn = Boolean(session?.user?.id);

  useEffect(() => {
    // 旧デモ通知が端末に残っていれば掃除（自動投入はしない）
    clearDemoNotifies();
    if (!session?.user?.id || session.user.id.startsWith("demo:")) {
      setUnread(0);
      return;
    }
    const syncUnread = () => {
      void fetchRemoteNotifies().then((r) => setUnread(r.unread));
    };
    syncUnread();
    const onFocus = () => syncUnread();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!handle) {
      setLocalAvatar(null);
      setAccountName(null);
      setPendingDm(0);
      return;
    }
    const syncProfile = () => {
      setLocalAvatar(readAvatarDataUrl(handle));
      setAccountName(displayAccountName(handle, readLocalProfile(handle)));
    };
    const syncPendingDm = () => {
      void fetchMyRequests().then((res) => {
        const me = handle.toLowerCase();
        const n = res.requests.filter(
          (r) =>
            r.status === "pending" && r.toHandle.toLowerCase() === me,
        ).length;
        setPendingDm(n);
      });
    };
    syncProfile();
    syncPendingDm();
    window.addEventListener("viscum-profile-updated", syncProfile);
    // focus のたびに /api/requests を叩かない（TTLキャッシュ＋一覧と二重取得を避ける）
    return () => {
      window.removeEventListener("viscum-profile-updated", syncProfile);
    };
  }, [handle]);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const portfolioHref = handle
    ? `/u/${encodeURIComponent(handle)}`
    : "/onboarding/handle";
  const avatarSrc = localAvatar ?? session?.user?.image ?? null;
  const faceName = accountName ?? (handle || session?.user?.email || "アカウント");
  const faceLabel =
    isDemoSession && handle
      ? `${faceName}（デモ）`
      : !handle
        ? "英語IDを設定"
        : faceName;
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <Link
        href={session?.user ? "/dashboard/notifications" : "/login"}
        title="通知"
        aria-label="通知"
        className="relative rounded-md p-2 text-viscum-trunk transition hover:bg-viscum-paper-2 hover:text-viscum-brand"
        onClick={() => {
          void fetchRemoteNotifies().then((r) => setUnread(r.unread));
        }}
      >
        <BellIcon className="h-5 w-5" />
        {session?.user && unread > 0 && (
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-viscum-berry"
            aria-hidden
          />
        )}
      </Link>

      <Link
        href={
          session?.user
            ? "/dashboard/messages"
            : "/login?callbackUrl=/dashboard/messages"
        }
        title="ご依頼DM"
        aria-label="ご依頼DM"
        className="relative rounded-md p-2 text-viscum-trunk transition hover:bg-viscum-paper-2 hover:text-viscum-brand"
        onClick={() => {
          if (handle) {
            void fetchMyRequests().then((res) => {
              const me = handle.toLowerCase();
              setPendingDm(
                res.requests.filter(
                  (r) =>
                    r.status === "pending" &&
                    r.toHandle.toLowerCase() === me,
                ).length,
              );
            });
          }
        }}
      >
        <DmIcon className="h-5 w-5" />
        {session?.user && pendingDm > 0 && (
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-viscum-berry"
            aria-hidden
          />
        )}
      </Link>

      {status === "loading" ? (
        <span className="px-2 text-[11px] text-viscum-muted">…</span>
      ) : isLoggedIn ? (
        <div className="relative" ref={rootRef}>
          <button
            type="button"
            title={
              handle
                ? `${faceLabel} (@${handle})`
                : "英語ID未設定。設定へ進んでください"
            }
            aria-label="アカウントメニュー"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-viscum-trunk transition hover:bg-viscum-paper-2 hover:text-viscum-brand"
          >
            <Avatar handle={handle || "?"} image={avatarSrc} size="sm" />
            <span className="hidden max-w-[7rem] truncate text-[11px] font-medium sm:inline">
              {faceLabel}
            </span>
          </button>

          {open && (
            <div
              id={menuId}
              role="menu"
              className="absolute right-0 z-40 mt-1.5 w-[17.5rem] overflow-hidden rounded-xl border border-viscum-line bg-white shadow-lg"
            >
              {/* 頭：アバター＋名前＋公開ページ */}
              <div className="flex items-start gap-3 border-b border-viscum-line px-3.5 py-3">
                <Avatar handle={handle || "?"} image={avatarSrc} size="lg" />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-[14px] font-semibold text-viscum-ink">
                    {faceLabel}
                  </p>
                  <p className="truncate text-[12px] text-viscum-muted">
                    {handle
                      ? `@${handle}${isDemoSession ? " · デモログイン中" : ""}`
                      : session?.user?.email || "英語ID未設定"}
                  </p>
                  {!handle ? (
                    <Link
                      href="/onboarding/handle"
                      role="menuitem"
                      onClick={close}
                      className="mt-0.5 inline-block text-[12px] font-medium text-viscum-berry-deep underline underline-offset-2"
                    >
                      英語IDを設定する
                    </Link>
                  ) : (
                    <Link
                      href={portfolioHref}
                      role="menuitem"
                      onClick={close}
                      className="mt-0.5 inline-block text-[12px] text-viscum-brand underline underline-offset-2"
                    >
                      プロフィール
                    </Link>
                  )}
                </div>
              </div>

              <div className="border-b border-viscum-line py-1.5">
                <MenuRow href="/dashboard" onNavigate={close}>
                  ダッシュボード
                </MenuRow>
                <MenuRow href="/dashboard/reactions" onNavigate={close}>
                  気になる
                </MenuRow>
              </div>

              <div className="px-2 py-1.5">
                <MenuRow href="/dashboard/settings" onNavigate={close}>
                  設定
                </MenuRow>
                <button
                  type="button"
                  role="menuitem"
                  className="w-full rounded-md px-2.5 py-2.5 text-left text-[13px] text-viscum-ink hover:bg-viscum-paper-2"
                  onClick={() => {
                    close();
                    const path =
                      typeof window !== "undefined"
                        ? window.location.pathname
                        : "/";
                    const stay =
                      path === "/" ||
                      path.startsWith("/u/") ||
                      path.startsWith("/w/") ||
                      path.startsWith("/lp");
                    void signOut({ callbackUrl: stay ? path : "/" });
                  }}
                >
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          title="ログイン"
          aria-label="ログイン"
          className="rounded-md p-2 text-viscum-trunk transition hover:bg-viscum-paper-2 hover:text-viscum-brand"
        >
          <UserIcon className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}

function MenuRow({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="block px-3.5 py-2 text-[13px] text-viscum-ink hover:bg-viscum-paper-2"
    >
      {children}
    </Link>
  );
}

function Avatar({
  handle,
  image,
  size,
}: {
  handle: string;
  image?: string | null;
  size: "sm" | "lg";
}) {
  const box = size === "lg" ? "h-10 w-10 text-sm" : "h-6 w-6 text-[10px]";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className={`${box} shrink-0 rounded-full object-cover`}
      />
    );
  }
  const letter = handle.slice(0, 1).toUpperCase();
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-viscum-berry font-semibold text-white ${box}`}
      aria-hidden
    >
      {letter}
    </span>
  );
}

function DmIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}
