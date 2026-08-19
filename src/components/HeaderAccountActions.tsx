"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/** 通知・ログイン（B段階） */
export function HeaderAccountActions({
  className = "",
  notifyDot = true,
}: {
  className?: string;
  notifyDot?: boolean;
}) {
  const { data: session, status } = useSession();

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
        <Link
          href="/me"
          title={`@${session.user.handle} の成績`}
          aria-label="マイシード"
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
        </Link>
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
