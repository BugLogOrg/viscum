import type { CompStatus } from "@/data/dummy-works";
import { formatYen } from "@/data/dummy-works";

const LABELS: Record<
  CompStatus,
  { text: (prize?: number, paymentsDone?: number) => string; className: string }
> = {
  open: {
    text: (prize) => (prize ? `開催中 · ${formatYen(prize)}` : "開催中"),
    className: "badge-open",
  },
  pay_soon: {
    text: (prize) =>
      prize ? `決済準備中 · ${formatYen(prize)}` : "決済準備中",
    className: "bg-viscum-bark text-white",
  },
  closed: {
    text: (_prize, paymentsDone) =>
      paymentsDone && paymentsDone > 0 ? "終了 · 支払い済み" : "終了",
    className: "badge-closed",
  },
  none: {
    text: () => "コメント歓迎",
    className: "badge-none",
  },
};

export function StatusBadge({
  status,
  prizeYen,
  paymentsDone,
  className = "",
  dense = false,
}: {
  status: CompStatus;
  prizeYen?: number;
  paymentsDone?: number;
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
        {LABELS.none.text()}
      </span>
    );
  }
  const L = LABELS[status];
  return (
    <span
      className={`inline-block rounded-full font-medium ${size} ${L.className} ${className}`}
    >
      {L.text(prizeYen, paymentsDone)}
    </span>
  );
}
