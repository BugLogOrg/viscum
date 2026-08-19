import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { PostForm } from "./PostForm";

/** S04 投稿／編集（ダミー。認証・DBなし） */
export default function NewWorkPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/" hidePostCta />
      <main className="px-4 py-6">
        <p className="text-xs text-viscum-muted">S04 · 投稿デモ</p>
        <h1 className="mt-1 text-xl font-semibold text-viscum-ink">シードする</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-viscum-muted">
          タイトルが棚の見出し、メンターへのお願いが入口。一言・別途お題は置きません（重複しやすいので）。コンペは任意の小さな広告です。
        </p>
        <div className="mt-6">
          <PostForm />
        </div>
        <p className="mt-10 text-center text-sm">
          <Link href="/" className="text-viscum-brand hover:underline">
            TOP
          </Link>
        </p>
      </main>
    </div>
  );
}
