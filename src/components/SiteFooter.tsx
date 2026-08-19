import Link from "next/link";

/** 全画面共通フッター（デモ表記込み） */
export function SiteFooter() {
  return (
    <footer className="px-4 py-8 text-center text-[11px] text-viscum-muted">
      <Link href="/lp" className="text-viscum-brand hover:underline">
        LP
      </Link>
      {" · "}
      <span className="tracking-[0.08em]">VISCUM</span>
      {" · ダミーデータ"}
    </footer>
  );
}
