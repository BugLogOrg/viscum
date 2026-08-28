/** デモ用の小さな併記バッジ（シーダー名・コメント著者など） */
export function DemoBadge({
  className = "",
  label = "デモ用",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`shrink-0 rounded bg-viscum-paper-2 px-1 py-0.5 text-[9px] font-medium text-viscum-muted ${className}`}
    >
      {label}
    </span>
  );
}
