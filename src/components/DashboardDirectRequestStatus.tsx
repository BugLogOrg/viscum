"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RequestDm } from "@/lib/local-request-dms";
import {
  formatRequestAmountLabel,
  formatRequestDmStamp,
} from "@/lib/local-request-dms";
import { displayRequestWorkTitle } from "@/lib/local-seeds";
import { RequestDeliverableStatus } from "@/components/RequestDeliverableStatus";

/**
 * ダッシュボード用：進行中のご依頼DMの成果物ステータス一覧。
 * 詳細・本文の正本は /dashboard/messages/[id]。
 */
export function DashboardDirectRequestStatus({
  handle,
}: {
  handle: string;
}) {
  const [rows, setRows] = useState<RequestDm[]>([]);
  const [loading, setLoading] = useState(true);
  const me = handle.toLowerCase();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch("/api/requests", { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          requests?: RequestDm[];
        };
        if (cancelled) return;
        setRows(Array.isArray(data.requests) ? data.requests : []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = rows
    .filter(
      (r) =>
        r.status !== "paid" &&
        r.status !== "declined" &&
        r.status !== "closed",
    )
    .slice(0, 8);

  return (
    <section id="request-status" className="scroll-mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-viscum-ink">
          直依頼の進捗
          {!loading && active.length > 0 ? (
            <span className="ml-1.5 text-[13px] font-normal text-viscum-muted">
              {active.length}件
            </span>
          ) : null}
        </h2>
        <Link
          href="/dashboard/messages"
          className="text-[13px] font-medium text-viscum-brand underline"
        >
          ご依頼DM一覧
        </Link>
      </div>
      <p className="text-[11px] leading-relaxed text-viscum-muted">
        成果物のステータス確認はご依頼DM本文が正本です。ここでも同じラベルで進捗を見られます。
      </p>

      {loading ? (
        <p className="text-[13px] text-viscum-muted">読み込み中…</p>
      ) : active.length === 0 ? (
        <div className="rounded-lg border border-dashed border-viscum-line px-4 py-5 text-center">
          <p className="text-[13px] text-viscum-muted">
            進行中の直依頼はありません。
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-viscum-line overflow-hidden rounded-lg border border-viscum-line bg-white/50">
          {active.map((r) => {
            const outbound = Boolean(r.outboundUnassigned);
            const incoming =
              !outbound && (r.toHandle || "").toLowerCase() === me;
            const peer = outbound
              ? "外リンク（返事待ち）"
              : incoming
                ? r.fromAccountName || r.fromHandle
                : r.toHandle || "相手未定";
            const stamp = r.updatedAt || r.createdAt;
            return (
              <li key={r.id}>
                <Link
                  href={`/dashboard/messages/${encodeURIComponent(r.id)}`}
                  className="block px-3 py-3 transition hover:bg-viscum-leaf-soft/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-viscum-ink">
                        {peer}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-viscum-muted">
                        {formatRequestAmountLabel(r.amountYen)} ·{" "}
                        {displayRequestWorkTitle(r.workId, r.workTitle)}
                      </p>
                      <p className="mt-1 space-y-0.5 text-[11px] tabular-nums leading-relaxed text-viscum-muted">
                        <span className="block">
                          作成 {formatRequestDmStamp(r.createdAt)}
                        </span>
                        {r.updatedAt && r.updatedAt !== r.createdAt ? (
                          <span className="block">
                            更新 {formatRequestDmStamp(r.updatedAt)}
                          </span>
                        ) : null}
                        {r.closesAt ? (
                          <span className="block text-viscum-berry-deep">
                            希望日 {formatRequestDmStamp(r.closesAt)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <RequestDeliverableStatus status={r.status} dense />
                  </div>
                  <p className="mt-1.5 text-right text-[11px] tabular-nums text-viscum-muted">
                    最終更新 {formatRequestDmStamp(stamp)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
