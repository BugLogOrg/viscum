"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  installDemoNotifies,
  readLocalNotifies,
  unreadNotifyCount,
} from "@/lib/local-notifies";
import { readAvatarDataUrl } from "@/lib/local-profile";

/** 通知・アカウントメニュー（note寄り：プロフィール頭＋ダッシュ／設定＋履歴） */
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
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const handle = session?.user?.handle;

  useEffect(() => {
    if (readLocalNotifies().length === 0) installDemoNotifies();
    setUnread(unreadNotifyCount());
    const onFocus = () => setUnread(unreadNotifyCount());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!handle) {
      setLocalAvatar(null);
      return;
    }
    const sync = () => setLocalAvatar(readAvatarDataUrl(handle));
    sync();
    window.addEventListener("viscum-profile-updated", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("viscum-profile-updated", sync);
      window.removeEventListener("focus", sync);
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
    : "/";
  const avatarSrc = localAvatar ?? session?.user?.image ?? null;
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <Link
        href={session?.user ? "/me/notifications" : "/login"}
        title="通知"
        aria-label="通知"
        className="relative rounded-md p-2 text-viscum-trunk transition hover:bg-viscum-paper-2 hover:text-viscum-brand"
        onClick={() => setUnread(unreadNotifyCount())}
      >
        <BellIcon className="h-5 w-5" />
        {session?.user && unread > 0 && (
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-viscum-berry"
            aria-hidden
          />
        )}
      </Link>

      {status === "loading" ? (
        <span className="px-2 text-[11px] text-viscum-muted">…</span>
      ) : session?.user && handle ? (
        <div className="relative" ref={rootRef}>
          <button
            type="button"
            title={`@${handle}`}
            aria-label="アカウントメニュー"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-viscum-trunk transition hover:bg-viscum-paper-2 hover:text-viscum-brand"
          >
            <Avatar handle={handle} image={avatarSrc} size="sm" />
            <span className="hidden max-w-[5.5rem] truncate text-[11px] font-medium sm:inline">
              @{handle}
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
                <Avatar handle={handle} image={avatarSrc} size="lg" />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-[14px] font-semibold text-viscum-ink">
                    @{handle}
                  </p>
                  <Link
                    href={portfolioHref}
                    role="menuitem"
                    onClick={close}
                    className="mt-0.5 inline-block text-[12px] text-viscum-brand underline underline-offset-2"
                  >
                    公開ポートフォリオ
                  </Link>
                </div>
              </div>

              {/* ダッシュボード／設定（noteの二ボタン） */}
              <div className="grid grid-cols-2 gap-2 border-b border-viscum-line px-3.5 py-3">
                <Link
                  href="/me"
                  role="menuitem"
                  onClick={close}
                  className="flex flex-col items-center gap-1 rounded-lg border border-viscum-line bg-viscum-paper/80 px-2 py-2.5 text-center transition hover:border-viscum-brand hover:bg-viscum-leaf-soft/40"
                >
                  <ChartIcon className="h-5 w-5 text-viscum-brand" />
                  <span className="text-[12px] font-medium text-viscum-ink">
                    ダッシュボード
                  </span>
                  <span className="text-[10px] leading-tight text-viscum-muted">
                    届き方
                  </span>
                </Link>
                <Link
                  href="/me/settings"
                  role="menuitem"
                  onClick={close}
                  className="flex flex-col items-center gap-1 rounded-lg border border-viscum-line bg-viscum-paper/80 px-2 py-2.5 text-center transition hover:border-viscum-brand hover:bg-viscum-leaf-soft/40"
                >
                  <GearIcon className="h-5 w-5 text-viscum-trunk" />
                  <span className="text-[12px] font-medium text-viscum-ink">
                    設定
                  </span>
                  <span className="text-[10px] leading-tight text-viscum-muted">
                    通知など
                  </span>
                </Link>
              </div>
              {/* シード */}
              <Section label="シード">
                <MenuRow href="/me" onNavigate={close}>
                  シードごとの届き方
                </MenuRow>
                <MenuRow href="/me/notifications" onNavigate={close}>
                  通知
                  {unread > 0 ? `（未読 ${unread}）` : ""}
                </MenuRow>
                <MenuRow href="/new" onNavigate={close}>
                  シードする
                </MenuRow>
              </Section>

              {/* 履歴：中ページでスキ／気になるを切り替え */}
              <div className="border-b border-viscum-line py-1.5">
                <MenuRow href="/me/reactions" onNavigate={close}>
                  履歴
                </MenuRow>
              </div>

              <div className="border-t border-viscum-line px-2 py-1.5">
                <button
                  type="button"
                  role="menuitem"
                  className="w-full rounded-md px-2.5 py-2.5 text-left text-[13px] text-viscum-ink hover:bg-viscum-paper-2"
                  onClick={() => {
                    close();
                    void signOut({ callbackUrl: "/" });
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

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-viscum-line py-1.5 last:border-b-0">
      <p className="px-3.5 pb-0.5 pt-1 text-[11px] font-medium text-viscum-muted">
        {label}
      </p>
      {children}
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

function ChartIcon({ className }: { className?: string }) {
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
      <path d="M3 3v18h18" />
      <path d="M7 16v-5" />
      <path d="M12 16V8" />
      <path d="M17 16v-9" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
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
