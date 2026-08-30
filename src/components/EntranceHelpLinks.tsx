import Link from "next/link";

/** 入口一文の横：説明ページへの薄い導線（フッターと併用） */
export function EntranceHelpLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      className={`shrink-0 text-[12px] leading-none text-viscum-muted ${className}`}
      aria-label="はじめに・FAQ"
    >
      <Link
        href="/lp"
        className="text-viscum-brand/90 hover:underline"
      >
        はじめに
      </Link>
      <span className="mx-1.5 text-viscum-line" aria-hidden>
        ·
      </span>
      <Link href="/faq" className="text-viscum-brand/90 hover:underline">
        FAQ
      </Link>
    </nav>
  );
}
