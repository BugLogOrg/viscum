import Link from "next/link";
import { VISCUM_X_URL } from "@/components/SiteFooter";

/** 入口一文の横：説明ページへの薄い導線（フッターと併用） */
export function EntranceHelpLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      className={`shrink-0 text-[12px] leading-none text-viscum-muted ${className}`}
      aria-label="はじめに・FAQ・公式X"
    >
      <Link
        href="/start"
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
      <span className="mx-1.5 text-viscum-line" aria-hidden>
        ·
      </span>
      <a
        href={VISCUM_X_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-viscum-brand/90 hover:underline"
        title="公式X @viscumorg"
      >
        X
      </a>
    </nav>
  );
}
