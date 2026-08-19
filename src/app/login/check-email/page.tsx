"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

function CheckEmailBody() {
  const params = useSearchParams();
  const email = params.get("email")?.trim() || "";

  return (
    <main className="px-4 py-8">
      <h1 className="text-xl font-semibold text-viscum-ink">メールを確認</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-viscum-muted">
        {email ? (
          <>
            <span className="text-viscum-ink">{email}</span>{" "}
            にログイン用リンクを送りました。届いたメールのリンクを開いてください。
          </>
        ) : (
          <>ログイン用リンクを送りました。届いたメールのリンクを開いてください。</>
        )}
      </p>
      <p className="mt-4 text-[12px] leading-relaxed text-viscum-muted">
        迷惑メールフォルダも確認してみてください。届かない場合は
        <Link href="/login" className="text-viscum-brand underline-offset-2 hover:underline">
          {" "}
          ログイン
        </Link>
        から再送できます。
      </p>
      <SiteFooter />
    </main>
  );
}

export default function CheckEmailPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/login" hidePostCta />
      <Suspense
        fallback={
          <main className="px-4 py-8 text-sm text-viscum-muted">読み込み中…</main>
        }
      >
        <CheckEmailBody />
      </Suspense>
    </div>
  );
}
