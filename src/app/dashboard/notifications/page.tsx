"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import {
  clearDemoNotifies,
  formatNotifyStamp,
  markAllNotifiesRead,
  markNotifyRead,
  readNotifyPrefs,
  visibleNotifies,
  type LocalNotify,
} from "@/lib/local-notifies";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [rows, setRows] = useState<LocalNotify[]>([]);

  function refresh() {
    setRows(visibleNotifies(readNotifyPrefs()));
  }

  useEffect(() => {
    clearDemoNotifies();
    refresh();
  }, []);

  if (status === "loading") {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/" hideOnMd hidePostCta />
        <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      </BrowseChrome>
    );
  }

  if (!session?.user) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">通知</h1>
          <p className="mt-2 text-[14px] text-viscum-muted">
            ログインすると通知が見られます。
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white"
          >
            ログインへ
          </Link>
        </main>
      </BrowseChrome>
    );
  }

  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-5 px-4 py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-viscum-ink">通知</h1>
            <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
              初期はシーダー向け（自分のシードへの反応・締切など）が主です。通知のオンオフは
              <Link href="/dashboard/settings" className="text-viscum-brand underline">
                設定
              </Link>
              へ。
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              markAllNotifiesRead();
              refresh();
            }}
            className="shrink-0 text-[12px] text-viscum-brand underline"
          >
            すべて既読
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/settings"
            className="text-[12px] text-viscum-brand underline"
          >
            通知の設定
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-viscum-line px-4 py-8 text-center text-[13px] text-viscum-muted">
            通知はありません。コメントやフォローなどが付くとここに並びます。
          </p>
        ) : (
          <ul className="divide-y divide-viscum-line overflow-hidden rounded-lg border border-viscum-line bg-white/60">
            {rows.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  onClick={() => {
                    markNotifyRead(n.id);
                    refresh();
                  }}
                  className={`block px-3 py-3 transition hover:bg-viscum-paper-2/80 ${
                    n.read ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-semibold text-viscum-ink">
                      {!n.read && (
                        <span
                          className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-viscum-berry align-middle"
                          aria-hidden
                        />
                      )}
                      {n.title}
                    </p>
                    <time className="shrink-0 text-[10px] tabular-nums text-viscum-muted">
                      {formatNotifyStamp(n.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[10px] text-viscum-muted">
                    {n.audience === "seeder" ? "シーダー向け" : "メンター参加"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </BrowseChrome>
  );
}
