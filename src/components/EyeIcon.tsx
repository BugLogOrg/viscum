/** 気になる／プロトコル黄の共通アイコン（ADR-036／046） */
export function EyeIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
      <circle
        cx="12"
        cy="12"
        r="2.75"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}
