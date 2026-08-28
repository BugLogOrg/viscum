import Link from "next/link";

/** 全画面共通フッター。サンプル棚と本番機能を混同させない */
export function SiteFooter() {
  return (
    <footer className="px-4 py-8 text-center text-[11px] text-viscum-muted">
      <Link href="/lp" className="text-viscum-brand hover:underline">
        LP
      </Link>
      {" · "}
      <Link href="/faq" className="text-viscum-brand hover:underline">
        FAQ
      </Link>
      {" · "}
      <Link href="/lab/protocol" className="text-viscum-brand hover:underline">
        色見本
      </Link>
      {" · "}
      <span className="tracking-[0.08em]">VISCUM</span>
      {" · "}
      <span>フィード作品の一部はサンプル</span>
    </footer>
  );
}
