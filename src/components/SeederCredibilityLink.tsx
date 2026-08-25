"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatYen, getSeederPayFacts } from "@/data/dummy-works";
import { accountLabelForHandle } from "@/data/suggested-seeders";

/**
 * 直依頼の受け手が「この人ちゃんと払うか」をすぐ見られる導線。
 * 公開PF（シーダー実績＝支払い完了の事実）へのリンク。
 */
export function SeederCredibilityLink({
  handle,
  className = "",
}: {
  handle: string;
  className?: string;
}) {
  const h = handle.replace(/^@/, "").trim();
  const label = accountLabelForHandle(h);
  const fallback = getSeederPayFacts(h);
  const [pay, setPay] = useState(fallback);

  useEffect(() => {
    if (!h) return;
    let cancelled = false;
    void fetch(`/api/u/${encodeURIComponent(h)}/pay-facts`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as {
          paymentsCount?: number;
          paidYenTotal?: number;
        };
        if (cancelled) return;
        if (typeof data.paymentsCount === "number") {
          setPay({
            handle: h,
            paymentsCount: data.paymentsCount,
            paidYenTotal: Number(data.paidYenTotal ?? 0),
          });
        }
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [h]);

  if (!h) return null;
  const hasPay = pay.paymentsCount > 0;

  return (
    <div
      className={`rounded-lg border border-viscum-line bg-viscum-paper-2/50 px-3 py-3 ${className}`}
    >
      <p className="text-[12px] font-medium text-viscum-ink">
        依頼主の支払実績（確認用・任意）
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-viscum-muted">
        スコアではありません。開くとプロフィールで支払い完了の件数が分かります。直依頼の中身は公開されません。ここで何か送る必要はありません。
      </p>
      <p className="mt-2 text-[13px] text-viscum-ink">
        <span className="font-medium">{label.line}</span>
        <span className="ml-2 text-[12px] text-viscum-muted">
          {hasPay
            ? `支払い完了 ${pay.paymentsCount}件 · 累計 ${formatYen(pay.paidYenTotal)}`
            : "支払い実績はまだなし（デモ含む）"}
        </span>
      </p>
      <Link
        href={`/u/${encodeURIComponent(h)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex text-[13px] font-medium text-viscum-brand underline"
      >
        プロフィールで支払実績を見る
      </Link>
    </div>
  );
}
