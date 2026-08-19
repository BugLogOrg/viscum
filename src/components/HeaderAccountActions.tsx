"use client";

/** 通知・ログイン（デモ）。認証前でも席だけ見せる */
export function HeaderAccountActions({
  className = "",
  /** 未読っぽい点（デモ固定） */
  notifyDot = true,
}: {
  className?: string;
  notifyDot?: boolean;
}) {
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
      <button
        type="button"
        title="ログイン／アカウント（準備中）"
        aria-label="ログイン"
        className="rounded-md p-2 text-viscum-trunk transition hover:bg-viscum-paper-2 hover:text-viscum-brand"
        onClick={() => {
          window.alert(
            "【デモ】ログインは準備中です。\n見る・読むは登録なし。書く・シード・払うときに入ります。",
          );
        }}
      >
        <UserIcon className="h-5 w-5" />
      </button>
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
