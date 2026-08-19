"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  clearDemoNotifies,
  formatNotifyStamp,
  installDemoNotifies,
  markAllNotifiesRead,
  markNotifyRead,
  readLocalNotifies,
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
    if (readLocalNotifies().length === 0) {
      installDemoNotifies();
    }
    refresh();
  }, []);

  if (status === "loading") {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper px-4 py-10 text-sm text-viscum-muted">
        読み込み中…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
        <SiteHeader backHref="/" hidePostCta />
        <main className="px-4 py-10">
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
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/" hidePostCta />
      <main className="space-y-5 px-4 py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-viscum-ink">通知</h1>
            <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
              初期はシーダー向け（自分のシードへの反応・締切など）が主です。通知のオンオフは
              <Link href="/me/settings" className="text-viscum-brand underline">
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
            href="/me/settings"
            className="text-[12px] text-viscum-brand underline"
          >
            通知の設定
          </Link>
          <button
            type="button"
            onClick={() => {
              if (rows.some((r) => r.id.startsWith("n_demo_"))) {
                clearDemoNotifies();
              } else {
                installDemoNotifies();
              }
              refresh();
            }}
            className="text-[12px] text-viscum-muted underline"
          >
            {rows.some((r) => r.id.startsWith("n_demo_"))
              ? "デモ通知を消す"
              : "デモ通知を入れる"}
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-viscum-line px-4 py-8 text-center text-[13px] text-viscum-muted">
            通知はありません。
            <Link href="/me/settings" className="text-viscum-brand underline">
              設定
            </Link>
            を確認するか、デモ通知を入れてみてください。
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
    </div>
  );
}
