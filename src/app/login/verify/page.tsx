"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * メール内リンクの着地。
 * Gmail等の先読みが /api/auth/callback を踏むとワンタイムトークンが消えるため、
 * ここではボタン押下（人間のクリック）でのみ本ログインへ進む。
 */
function VerifyBody() {
  const params = useSearchParams();
  const raw = params.get("url")?.trim() || "";

  const target = useMemo(() => {
    if (!raw) return null;
    try {
      const u = new URL(raw);
      // 自サイトの Auth コールバックだけ許可
      if (!u.pathname.startsWith("/api/auth/callback/")) return null;
      return u.toString();
    } catch {
      return null;
    }
  }, [raw]);

  if (!target) {
    return (
      <main className="px-4 py-8">
        <h1 className="text-xl font-semibold text-viscum-ink">
          リンクが無効です
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-viscum-muted">
          ログイン用リンクが壊れているか、期限切れです。もう一度ログイン画面から送ってください。
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
        >
          ログインへ
        </Link>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <h1 className="text-xl font-semibold text-viscum-ink">ログインの確認</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-viscum-muted">
        メールアプリの自動チェックでリンクが無効にならないよう、ここで一度止めています。下のボタンを押すとVISCUMに入れます。
      </p>
      <a
        href={target}
        className="mt-8 flex w-full items-center justify-center rounded-md bg-viscum-berry px-4 py-3 text-[15px] font-medium text-white hover:bg-viscum-berry-deep"
      >
        ログインする
      </a>
      <p className="mt-4 text-[12px] leading-relaxed text-viscum-muted">
        ボタンが効かない場合は、もう一度
        <Link href="/login" className="text-viscum-brand underline">
          ログイン画面
        </Link>
        からリンクを送ってください。
      </p>
      <SiteFooter />
    </main>
  );
}

export default function LoginVerifyPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader hidePostCta hideAccountActions />
      <Suspense
        fallback={
          <main className="px-4 py-8 text-sm text-viscum-muted">
            読み込み中…
          </main>
        }
      >
        <VerifyBody />
      </Suspense>
    </div>
  );
}
