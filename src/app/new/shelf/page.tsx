import Link from "next/link";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { PostForm } from "../PostForm";

/** シード棚レーン（ADR-038） */
export default function NewShelfPage() {
  return (
    <BrowseChrome>
      <SiteHeader backHref="/new" hideOnMd hidePostCta />
      <main className="max-w-lg px-4 py-6">
        <p className="text-xs text-viscum-muted">シード棚に出す</p>
        <h1 className="mt-1 text-xl font-semibold text-viscum-ink">
          シードする（シード棚）
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-viscum-muted">
          「何が知りたい？」から一つ選びます（感想／初見の反応／改善／広めたい）。保存後に公開すると作品一覧へ。指名依頼は入口の別レーンです。
        </p>
        <p className="mt-2 text-[12px]">
          <Link href="/new" className="text-viscum-brand underline">
            ← 入り口に戻る
          </Link>
        </p>
        <div className="mt-6">
          <PostForm />
        </div>
      </main>
    </BrowseChrome>
  );
}
