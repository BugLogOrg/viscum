"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  clearPendingLoginEmail,
  readPendingLoginEmail,
} from "@/lib/pending-login-email";
import {
  readPostLoginDestination,
  rememberPostLoginDestination,
} from "@/lib/post-login-destination";

function CheckEmailBody() {
  const params = useSearchParams();
  const fromQuery = params.get("email")?.trim() || "";
  const nextFromQuery = params.get("next")?.trim() || "";
  const [email, setEmail] = useState(fromQuery);
  const [loginHref, setLoginHref] = useState("/login");

  useEffect(() => {
    if (fromQuery) {
      setEmail(fromQuery);
      return;
    }
    const remembered = readPendingLoginEmail();
    if (remembered) setEmail(remembered);
  }, [fromQuery]);

  useEffect(() => {
    if (nextFromQuery.startsWith("/") && !nextFromQuery.startsWith("//")) {
      rememberPostLoginDestination(nextFromQuery);
      setLoginHref(
        `/login?callbackUrl=${encodeURIComponent(nextFromQuery)}`,
      );
      return;
    }
    const dest = readPostLoginDestination("/");
    if (dest && dest !== "/") {
      setLoginHref(`/login?callbackUrl=${encodeURIComponent(dest)}`);
    }
  }, [nextFromQuery]);

  useEffect(() => {
    // リンクを踏んで戻ってきたあとに古い宛先が残らないよう、表示後しばらくで消す
    if (!email) return;
    const t = window.setTimeout(() => clearPendingLoginEmail(), 30 * 60 * 1000);
    return () => window.clearTimeout(t);
  }, [email]);

  return (
    <main className="px-4 py-8">
      <h1 className="text-xl font-semibold text-viscum-ink">メールを確認</h1>

      {email ? (
        <div className="mt-4 rounded-lg border border-viscum-brand/35 bg-viscum-leaf-soft/40 px-4 py-3">
          <p className="text-[12px] font-medium text-viscum-muted">送り先</p>
          <p className="mt-1 break-all text-[16px] font-semibold text-viscum-ink">
            {email}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-viscum-muted">
            このアドレスの受信箱を開いてください（複数アカウントがある場合は、上の宛先のほう）。
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[14px] leading-relaxed text-viscum-muted">
          ログイン用リンクを送りました。入力したメールの受信箱を開いてください。
        </p>
      )}

      <p className="mt-4 text-[14px] leading-relaxed text-viscum-ink">
        件名は「【VISCUM】ログイン用リンク」です。届いたメールのリンクを開くと入れます。
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-viscum-muted">
        From は <span className="text-viscum-ink">VISCUM</span>（
        <span className="break-all">mail.viscum.org</span>
        ）です。迷惑メールフォルダも確認してみてください。
      </p>
      <p className="mt-4 text-[12px] leading-relaxed text-viscum-muted">
        届かない・宛先を間違えた場合は
        <Link
          href={loginHref}
          className="text-viscum-brand underline-offset-2 hover:underline"
        >
          {" "}
          ログイン
        </Link>
        から別のアドレスで再送できます。
      </p>
      <SiteFooter />
    </main>
  );
}

export default function CheckEmailPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader hidePostCta hideAccountActions />
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
