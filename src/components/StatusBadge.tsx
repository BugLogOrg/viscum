import type { CompStatus } from "@/data/dummy-works";
import { formatYen } from "@/data/dummy-works";

/** UIバッジ用。売る金額ではなく場に載せた褒賞として見せる */
function prizePart(prize: number): string {
  return `褒賞 ${formatYen(prize)}`;
}

const LABELS: Record<
  CompStatus,
  { text: (prize?: number, paymentsDone?: number, planLabel?: string) => string; className: string }
> = {
  open: {
    text: (prize, _paymentsDone, planLabel) => {
      if (planLabel && prize) return `${planLabel} · ${prizePart(prize)}`;
      if (prize) return `開催中 · ${prizePart(prize)}`;
      return planLabel ?? "開催中";
    },
    className: "badge-open",
  },
  pay_soon: {
    text: (prize, _paymentsDone, planLabel) => {
      const head = planLabel ?? "決済準備中";
      return prize ? `${head} · ${prizePart(prize)}` : head;
    },
    className: "bg-viscum-bark text-white",
  },
  closed: {
    text: (_prize, paymentsDone) =>
      paymentsDone && paymentsDone > 0 ? "終了 · 支払い済み" : "終了",
    className: "badge-closed",
  },
  none: {
    text: (_prize, _paymentsDone, planLabel) => planLabel ?? "コメント歓迎",
    className: "badge-none",
  },
};

export function StatusBadge({
  status,
  prizeYen,
  paymentsDone,
  planLabel,
  className = "",
  dense = false,
}: {
  status: CompStatus;
  prizeYen?: number;
  paymentsDone?: number;
  /** 例: 初見レビュー／改善提案／公開ブースト／無料コメント */
  planLabel?: string;
  className?: string;
  dense?: boolean;
}) {
  const size = dense
    ? "px-1.5 py-0 text-[10px]"
    : "px-2.5 py-0.5 text-xs";

  if (status === "none") {
    return (
      <span
        className={`inline-block rounded-full font-medium ${size} ${LABELS.none.className} ${className}`}
      >
        {LABELS.none.text(undefined, undefined, planLabel)}
      </span>
    );
  }
  const L = LABELS[status];
  return (
    <span
      className={`inline-block rounded-full font-medium ${size} ${L.className} ${className}`}
    >
      {L.text(prizeYen, paymentsDone, planLabel)}
    </span>
  );
}
