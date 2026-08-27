import type { RequestDmStatus } from "@/lib/local-request-dms";
import {
  deliverableStatusHint,
  statusLabel,
} from "@/lib/local-request-dms";

type Props = {
  status: RequestDmStatus;
  /** コンパクト（一覧行）かカード（スレ本文）か */
  dense?: boolean;
  className?: string;
};

/**
 * 直依頼の成果物ステータス表示。
 * 正本はご依頼DM本文。ダッシュボードからも同じラベルで確認する。
 */
export function RequestDeliverableStatus({
  status,
  dense = false,
  className = "",
}: Props) {
  const label = statusLabel(status);
  const hint = deliverableStatusHint(status);
  const tone =
    status === "paid"
      ? "border-viscum-brand/35 bg-viscum-leaf-soft/50 text-viscum-ink"
      : status === "pay_waiting"
        ? "border-viscum-berry/35 bg-viscum-berry/5 text-viscum-ink"
        : status === "declined" || status === "closed"
          ? "border-viscum-line bg-viscum-paper-2/60 text-viscum-muted"
          : "border-viscum-line bg-white/70 text-viscum-ink";

  if (dense) {
    return (
      <span
        className={`inline-flex max-w-full truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${tone} ${className}`}
        title={hint}
      >
        {label}
      </span>
    );
  }

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${tone} ${className}`}
      role="status"
    >
      <p className="text-[11px] font-medium tracking-wide text-viscum-muted">
        成果物ステータス
      </p>
      <p className="mt-0.5 text-[14px] font-semibold text-viscum-ink">{label}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
        {hint}
      </p>
    </div>
  );
}
