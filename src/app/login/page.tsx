"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

function safeCallback(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default function LoginPage() {
  const [handle, setHandle] = useState("mDB");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const githubEnabled = process.env.NEXT_PUBLIC_AUTH_GITHUB === "1";

  function readCallback(): string {
    if (typeof window === "undefined") return "/dashboard";
    return safeCallback(
      new URLSearchParams(window.location.search).get("callbackUrl"),
    );
  }

  async function demoLogin(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const callbackUrl = readCallback();
    const res = await signIn("demo", {
      handle,
      redirect: false,
      callbackUrl,
    });
    setPending(false);
    if (res?.error) {
      setError("ログインに失敗しました。デモログインが無効かもしれません。");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/" hidePostCta />
      <main className="px-4 py-8">
        <h1 className="text-xl font-semibold text-viscum-ink">ログイン</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
          見る・読むは登録なしのままです。ログインすると、自分用のダッシュボードと、シード／書く／払う／PFコメントが使えます。
        </p>

        <form onSubmit={demoLogin} className="mt-8 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-viscum-ink">
              英語ID（デモ）
            </label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] focus:border-viscum-brand focus:outline-none"
              placeholder="mDB"
              autoComplete="username"
            />
          </div>
          {error && (
            <p className="text-[13px] text-viscum-berry-deep">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
          >
            {pending ? "入っています…" : "デモログイン"}
          </button>
          <p className="text-[11px] leading-relaxed text-viscum-muted">
            英数字と _ のみ。公開の顔・メールの「さん」はログイン後の
            <span className="text-viscum-ink">アカウント名</span>
            （プロフィール）で別途設定します。PFコメントのコテハンはこの英語IDです。
          </p>
        </form>

        {githubEnabled && (
          <button
            type="button"
            className="mt-4 w-full rounded-md border border-viscum-line px-4 py-2.5 text-sm font-medium text-viscum-ink hover:bg-viscum-paper-2"
            onClick={() =>
              signIn("github", { callbackUrl: readCallback() })
            }
          >
            GitHubでログイン
          </button>
        )}

        <SiteFooter />
      </main>
    </div>
  );
}
