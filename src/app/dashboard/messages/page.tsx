"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import {
  formatYen,
  installDemoRequestDms,
  readRequestDms,
  statusLabel,
  type RequestDm,
} from "@/lib/local-request-dms";

export default function MessagesIndexPage() {
  const { data: session, status } = useSession();
  const [rows, setRows] = useState<RequestDm[]>([]);
  const handle = session?.user?.handle;

  useEffect(() => {
    if (!handle) return;
    installDemoRequestDms(handle);
    setRows(readRequestDms());
  }, [handle]);

  const mine = useMemo(() => {
    if (!handle) return [];
    return rows
      .filter((r) => r.toHandle === handle || r.fromHandle === handle)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [rows, handle]);

  const pending = mine.filter((r) => r.status === "pending" && r.toHandle === handle);

  if (status === "loading") {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
        <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      </BrowseChrome>
    );
  }

  if (!session?.user || !handle) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">ご依頼DM</h1>
          <p className="mt-2 text-[14px] text-viscum-muted">
            ログインが必要です。
          </p>
          <Link
            href="/login?callbackUrl=/dashboard/messages"
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
      <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">ご依頼DM</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
            直依頼ごとの薄いやりとりです。全ユーザーの受信箱ではありません（デモ・端末内）。
          </p>
        </div>

        {pending.length > 0 && (
          <p className="rounded-md border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-2 text-[13px] text-viscum-ink">
            未返信のご依頼が {pending.length} 件あります
          </p>
        )}

        <ul className="divide-y divide-viscum-line rounded-lg border border-viscum-line bg-white/50">
          {mine.map((r) => {
            const incoming = r.toHandle === handle;
            const peer = incoming ? r.fromHandle : r.toHandle;
            const peerName = incoming
              ? r.fromAccountName || r.fromHandle
              : r.toHandle;
            return (
              <li key={r.id}>
                <Link
                  href={`/dashboard/messages/${encodeURIComponent(r.id)}`}
                  className="block px-3 py-3 transition hover:bg-viscum-leaf-soft/30"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[14px] font-medium text-viscum-ink">
                      {peerName}
                      <span className="font-normal text-viscum-muted">
                        {" "}
                        (@{peer})
                      </span>
                    </p>
                    <span
                      className={`shrink-0 text-[11px] ${
                        r.status === "pending"
                          ? "font-medium text-viscum-berry-deep"
                          : "text-viscum-muted"
                      }`}
                    >
                      {statusLabel(r.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-viscum-muted">
                    {incoming ? "受信" : "送信"} · {formatYen(r.amountYen)} ·{" "}
                    {r.workTitle}
                  </p>
                </Link>
              </li>
            );
          })}
          {mine.length === 0 && (
            <li className="px-3 py-8 text-center text-[13px] text-viscum-muted">
              まだご依頼DMはありません
            </li>
          )}
        </ul>
      </main>
    </BrowseChrome>
  );
}
