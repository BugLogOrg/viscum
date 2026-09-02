"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { RequestDm } from "@/lib/local-request-dms";
import {
  formatRequestDmStamp,
  formatYen,
} from "@/lib/local-request-dms";
import { displayRequestWorkTitle } from "@/lib/local-seeds";
import { RequestDeliverableStatus } from "@/components/RequestDeliverableStatus";
import { isDmRowAlert, needsDmAttention } from "@/lib/dm-attention";
import { getDmThreadSeenMap } from "@/lib/dm-thread-seen";

type Tab = "active" | "inbox" | "sent";

type Props = {
  handle: string;
  requests: RequestDm[];
  invitePaths: Record<string, string>;
  emptyHint: string;
};

function activityAt(r: RequestDm) {
  return r.updatedAt || r.createdAt;
}

function isActiveRequest(r: RequestDm) {
  return (
    r.status !== "paid" &&
    r.status !== "declined" &&
    r.status !== "closed"
  );
}

export function MessagesInbox({
  handle,
  requests,
  invitePaths,
  emptyHint,
}: Props) {
  const [tab, setTab] = useState<Tab>("active");
  const [seenMap, setSeenMap] = useState<Record<string, string>>({});
  const me = handle.toLowerCase();

  useEffect(() => {
    setSeenMap(getDmThreadSeenMap());
    const sync = () => setSeenMap(getDmThreadSeenMap());
    window.addEventListener("focus", sync);
    window.addEventListener("viscum-dm-seen", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("viscum-dm-seen", sync);
    };
  }, []);

  const filtered = useMemo(() => {
    const rows = [...requests].sort((a, b) =>
      activityAt(b).localeCompare(activityAt(a)),
    );
    if (tab === "active") {
      return rows.filter(isActiveRequest);
    }
    if (tab === "inbox") {
      return rows.filter(
        (r) =>
          !r.outboundUnassigned &&
          r.toHandle.toLowerCase() === me,
      );
    }
    return rows.filter(
      (r) =>
        r.outboundUnassigned ||
        r.fromHandle.toLowerCase() === me,
    );
  }, [requests, tab, me]);

  const counts = useMemo(() => {
    let inbox = 0;
    let sent = 0;
    let active = 0;
    let alertActive = 0;
    let alertInbox = 0;
    let alertSent = 0;
    for (const r of requests) {
      const alert = isDmRowAlert(r, handle, seenMap[r.id]);
      const inInbox =
        !r.outboundUnassigned && r.toHandle.toLowerCase() === me;
      const inSent =
        Boolean(r.outboundUnassigned) ||
        r.fromHandle.toLowerCase() === me;
      if (isActiveRequest(r)) {
        active += 1;
        if (alert) alertActive += 1;
      }
      if (inInbox) {
        inbox += 1;
        if (alert) alertInbox += 1;
      }
      if (inSent) {
        sent += 1;
        if (alert) alertSent += 1;
      }
    }
    return {
      active,
      inbox,
      sent,
      alertActive,
      alertInbox,
      alertSent,
    };
  }, [requests, me, handle, seenMap]);

  const tabs: {
    id: Tab;
    label: string;
    count: number;
    alerts: number;
  }[] = [
    {
      id: "active",
      label: "進行中",
      count: counts.active,
      alerts: counts.alertActive,
    },
    {
      id: "inbox",
      label: "依頼された",
      count: counts.inbox,
      alerts: counts.alertInbox,
    },
    {
      id: "sent",
      label: "依頼した",
      count: counts.sent,
      alerts: counts.alertSent,
    },
  ];

  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-viscum-ink">
          やりとり・進捗
        </h2>
        <p className="text-[11px] text-viscum-muted">最新の更新が上</p>
      </div>

      <div
        className="flex flex-wrap rounded-lg border border-viscum-line bg-white/60 p-0.5"
        role="tablist"
        aria-label="ご依頼DMの絞り込み"
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
              className={`relative min-w-[4.5rem] flex-1 rounded-md px-1.5 py-2 text-[11px] font-medium transition sm:text-[12px] ${
                on
                  ? t.id === "inbox"
                    ? "bg-viscum-berry/15 text-viscum-berry-deep"
                    : t.id === "sent"
                      ? "bg-viscum-leaf-soft text-viscum-leaf-deep"
                      : "bg-viscum-bark-soft text-viscum-ink"
                  : "text-viscum-muted hover:text-viscum-ink"
              }`}
            >
              {t.label}
              <span className="ml-1 tabular-nums opacity-70">{t.count}</span>
              {t.alerts > 0 ? (
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-viscum-berry"
                  aria-label={`未確認 ${t.alerts}件`}
                />
              ) : null}
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
          const alert = isDmRowAlert(r, handle, seenMap[r.id]);
          const actionNeeded = needsDmAttention(r, handle);
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
                      <p className="flex min-w-0 items-center gap-1.5 truncate text-[14px] font-medium text-viscum-ink">
                        {alert ? (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-viscum-berry"
                            title={actionNeeded ? "対応が必要" : "更新あり"}
                            aria-label={actionNeeded ? "対応が必要" : "更新あり"}
                          />
                        ) : null}
                        <span className="truncate">
                          {peerName}
                          {peer ? (
                            <span className="font-normal text-viscum-muted">
                              {" "}
                              (@{peer})
                            </span>
                          ) : null}
                        </span>
                      </p>
                      <RequestDeliverableStatus
                        status={r.status}
                        dense
                      />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-viscum-muted">
                      {formatYen(r.amountYen)} ·{" "}
                      {displayRequestWorkTitle(r.workId, r.workTitle)}
                      {invitePath ? " · 招待あり" : ""}
                      {actionNeeded ? " · 対応待ち" : alert ? " · 更新" : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <time
                    dateTime={stamp}
                    className={`rounded-sm px-1.5 py-0.5 text-[11px] tabular-nums ${
                      alert
                        ? "bg-viscum-berry/10 font-medium text-viscum-berry-deep"
                        : outbound
                          ? "bg-white/60 text-viscum-muted"
                          : incoming
                            ? "bg-viscum-berry/10 font-medium text-viscum-berry-deep"
                            : "bg-white/50 font-medium text-viscum-leaf-deep"
                    }`}
                  >
                    最終更新 {formatRequestDmStamp(stamp)}
                  </time>
                </div>
              </Link>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-8 text-center text-[13px] text-viscum-muted">
            {tab === "active"
              ? "進行中のご依頼はありません"
              : tab === "inbox"
                ? "まだ依頼されていません"
                : emptyHint || "まだ依頼していません"}
          </li>
        )}
      </ul>
    </section>
  );
}
