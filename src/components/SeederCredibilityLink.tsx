"use client";

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
  if (!h) return null;
  const label = accountLabelForHandle(h);
  const pay = getSeederPayFacts(h);
  const hasPay = pay.paymentsCount > 0;

  return (
    <div
      className={`rounded-lg border border-viscum-line bg-viscum-paper-2/50 px-3 py-3 ${className}`}
    >
      <p className="text-[12px] font-medium text-viscum-ink">依頼主の実績</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-viscum-muted">
        スコアではなく、支払い完了の事実です。プロフィールで確認できます。
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
        className="mt-2 inline-flex text-[13px] font-medium text-viscum-brand underline"
      >
        依頼主のプロフィール・実績を見る
      </Link>
    </div>
  );
}
