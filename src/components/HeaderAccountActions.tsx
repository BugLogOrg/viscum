"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

/** 通知・アカウントメニュー（ログイン後はドロップダウン） */
export function HeaderAccountActions({
  className = "",
  notifyDot = true,
}: {
  className?: string;
  notifyDot?: boolean;
}) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

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

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <button
        type="button"
        title="通知（準備中）"
        aria-label="通知"
        className="relative rounded-md p-2 text-viscum-trunk transition hover:bg-viscum-paper-2 hover:text-viscum-brand"
        onClick={() => {
          window.alert(
            "【デモ】通知は準備中です。\n直依頼・採用・チップ・専門タグの開催中などが届く想定です。",
          );
        }}
      >
        <BellIcon className="h-5 w-5" />
        {notifyDot && (
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-viscum-berry"
            aria-hidden
          />
        )}
      </button>

      {status === "loading" ? (
        <span className="px-2 text-[11px] text-viscum-muted">…</span>
      ) : session?.user ? (
        <div className="relative" ref={rootRef}>
          <button
            type="button"
            title={`@${session.user.handle}`}
            aria-label="アカウントメニュー"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-viscum-trunk transition hover:bg-viscum-paper-2 hover:text-viscum-brand"
          >
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <UserIcon className="h-5 w-5" />
            )}
            <span className="hidden max-w-[5.5rem] truncate text-[11px] font-medium sm:inline">
              @{session.user.handle}
            </span>
          </button>

          {open && (
            <div
              id={menuId}
              role="menu"
              className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-lg border border-viscum-line bg-viscum-paper shadow-md"
            >
              <p className="border-b border-viscum-line px-3 py-2 text-[11px] text-viscum-muted">
                @{session.user.handle}
              </p>
              <nav className="flex flex-col py-1 text-[13px]">
                <MenuLink href="/me" onNavigate={() => setOpen(false)}>
                  シードごとの届き方
                </MenuLink>
                <MenuLink
                  href="/me/reactions"
                  onNavigate={() => setOpen(false)}
                >
                  スキ・気になる履歴
                </MenuLink>
                <MenuLink
                  href="/me/profile"
                  onNavigate={() => setOpen(false)}
                >
                  プロフィール編集
                </MenuLink>
                <MenuLink
                  href={`/u/${encodeURIComponent(session.user.handle)}`}
                  onNavigate={() => setOpen(false)}
                >
                  公開ポートフォリオ
                </MenuLink>
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-3 py-2.5 text-left text-viscum-ink hover:bg-viscum-leaf-soft/50"
                  onClick={() => {
                    setOpen(false);
                    void signOut({ callbackUrl: "/" });
                  }}
                >
                  ログアウト
                </button>
              </nav>
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

function MenuLink({
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
      className="px-3 py-2.5 text-viscum-ink hover:bg-viscum-leaf-soft/50"
    >
      {children}
    </Link>
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
