/** VISCUM マーク（F色01 ティール：四角＞丸大＞実）。実色は berry 固定 */
export function ViscumMark({
  className = "h-5 w-5",
  title = "VISCUM",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={`inline-block shrink-0 ${className}`}
      role="img"
      aria-label={title}
    >
      <rect width="64" height="64" rx="14" fill="#2db5a0" />
      <circle cx="32" cy="32" r="26" fill="#0f7a6b" />
      <circle cx="44" cy="20" r="7" fill="#c45c3e" />
    </svg>
  );
}
