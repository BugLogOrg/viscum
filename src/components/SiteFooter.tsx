import Link from "next/link";

export const VISCUM_X_URL = "https://x.com/viscumorg";

/** 全画面共通フッター。ラボ用ページは載せない */
export function SiteFooter() {
  return (
    <footer className="px-4 py-8 text-center text-[11px] text-viscum-muted">
      <Link href="/start" className="text-viscum-brand hover:underline">
        はじめに
      </Link>
      {" · "}
      <Link href="/faq" className="text-viscum-brand hover:underline">
        FAQ
      </Link>
      {" · "}
      <a
        href={VISCUM_X_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-viscum-brand hover:underline"
      >
        公式X
      </a>
      {" · "}
      <Link href="/terms" className="text-viscum-brand hover:underline">
        利用規約
      </Link>
      {" · "}
      <Link href="/privacy" className="text-viscum-brand hover:underline">
        プライバシー
      </Link>
      {" · "}
      <span className="tracking-[0.08em]">VISCUM</span>
      {" · "}
      <span>フィード作品の一部はサンプル</span>
    </footer>
  );
}
