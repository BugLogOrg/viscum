"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RequestDm } from "@/lib/local-request-dms";
import {
  formatRequestDmStamp,
  formatYen,
  statusLabel,
} from "@/lib/local-request-dms";
import { displayRequestWorkTitle } from "@/lib/local-seeds";

type Tab = "all" | "inbox" | "sent";

type Props = {
  handle: string;
  requests: RequestDm[];
  invitePaths: Record<string, string>;
  emptyHint: string;
};

function activityAt(r: RequestDm) {
  return r.updatedAt || r.createdAt;
}

export function MessagesInbox({
  handle,
  requests,
  invitePaths,
  emptyHint,
}: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const me = handle.toLowerCase();

  const filtered = useMemo(() => {
    const rows = [...requests].sort((a, b) =>
      activityAt(b).localeCompare(activityAt(a)),
    );
    if (tab === "inbox") {
      return rows.filter(
        (r) =>
          !r.outboundUnassigned &&
          r.toHandle.toLowerCase() === me,
      );
    }
    if (tab === "sent") {
      return rows.filter(
        (r) =>
          r.outboundUnassigned ||
          r.fromHandle.toLowerCase() === me,
      );
    }
    return rows;
  }, [requests, tab, me]);

  const counts = useMemo(() => {
    let inbox = 0;
    let sent = 0;
    for (const r of requests) {
      if (
        !r.outboundUnassigned &&
        r.toHandle.toLowerCase() === me
      ) {
        inbox += 1;
      } else if (
        r.outboundUnassigned ||
        r.fromHandle.toLowerCase() === me
      ) {
        sent += 1;
      }
    }
    return { all: requests.length, inbox, sent };
  }, [requests, me]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "すべて", count: counts.all },
    { id: "inbox", label: "依頼された", count: counts.inbox },
    { id: "sent", label: "依頼した", count: counts.sent },
  ];

  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-viscum-ink">やりとり</h2>
        <p className="text-[11px] text-viscum-muted">最新の更新が上</p>
      </div>

      <div
        className="flex rounded-lg border border-viscum-line bg-white/60 p-0.5"
        role="tablist"
        aria-label="依頼した・依頼された"
      >
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-md px-2 py-2 text-[12px] font-medium transition ${
                on
                  ? t.id === "inbox"
                    ? "bg-viscum-berry/15 text-viscum-berry-deep"
                    : t.id === "sent"
                      ? "bg-viscum-leaf-soft text-viscum-leaf-deep"
                      : "bg-viscum-paper-2 text-viscum-ink"
                  : "text-viscum-muted hover:text-viscum-ink"
              }`}
            >
              {t.label}
              <span className="ml-1 tabular-nums opacity-70">{t.count}</span>
            </button>
          );
        })}
      </div>

      <ul className="overflow-hidden rounded-lg border border-viscum-line bg-white/50">
        {filtered.map((r) => {
          const outbound = Boolean(r.outboundUnassigned);
          const incoming =
            !outbound && r.toHandle.toLowerCase() === me;
          const peer = outbound
            ? ""
            : incoming
              ? r.fromHandle
              : r.toHandle;
          const peerName = outbound
            ? "外リンク（返事待ち）"
            : incoming
              ? r.fromAccountName || r.fromHandle
              : r.toHandle;
          const invitePath = r.inviteId
            ? invitePaths[r.inviteId] ?? `/dm/i/${r.inviteId}`
            : null;
          const stamp = activityAt(r);
          return (
            <li key={r.id} className="border-b border-viscum-line last:border-b-0">
              <Link
                href={`/dashboard/messages/${encodeURIComponent(r.id)}`}
                className={`block border-l-4 px-3 py-3 transition ${
                  outbound
                    ? "border-l-viscum-trunk/50 bg-viscum-paper-2/40 hover:bg-viscum-paper-2/70"
                    : incoming
                      ? "border-l-viscum-berry bg-viscum-berry/5 hover:bg-viscum-berry/10"
                      : "border-l-viscum-leaf bg-viscum-leaf-soft/35 hover:bg-viscum-leaf-soft/55"
                }`}
              >
                <div className="flex gap-3">
                  {r.workThumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.workThumbUrl}
                      alt=""
                      className="h-12 w-[4.6rem] shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-[4.6rem] shrink-0 items-center justify-center rounded bg-viscum-paper-2 text-[10px] text-viscum-muted">
                      無
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[14px] font-medium text-viscum-ink">
                        {peerName}
                        {peer ? (
                          <span className="font-normal text-viscum-muted">
                            {" "}
                            (@{peer})
                          </span>
                        ) : null}
                      </p>
                      <span
                        className={`shrink-0 text-[11px] ${
                          outbound || r.status === "pending"
                            ? "font-medium text-viscum-berry-deep"
                            : "text-viscum-muted"
                        }`}
                      >
                        {outbound ? "返事待ち" : statusLabel(r.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-viscum-muted">
                      {formatYen(r.amountYen)} ·{" "}
                      {displayRequestWorkTitle(r.workId, r.workTitle)}
                      {invitePath ? " · 招待あり" : ""}
                    </p>
                    <p
                      className={`mt-1.5 rounded-sm px-1.5 py-1 text-right text-[11px] tabular-nums ${
                        outbound
                          ? "bg-white/50 text-viscum-muted"
                          : incoming
                            ? "bg-viscum-berry/10 font-medium text-viscum-berry-deep"
                            : "bg-viscum-leaf-soft/80 font-medium text-viscum-leaf-deep"
                      }`}
                    >
                      <time dateTime={stamp}>
                        最終更新 {formatRequestDmStamp(stamp)}
                      </time>
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-8 text-center text-[13px] text-viscum-muted">
            {tab === "inbox"
              ? "まだ依頼されていません"
              : tab === "sent"
                ? "まだ依頼していません"
                : emptyHint}
          </li>
        )}
      </ul>
    </section>
  );
}
