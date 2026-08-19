"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

function safeCallback(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

const magicLinkUi =
  process.env.NEXT_PUBLIC_AUTH_MAGIC_LINK !== "0";

const POST_ONBOARDING_KEY = "viscum.postOnboarding";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("guest");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const githubEnabled = process.env.NEXT_PUBLIC_AUTH_GITHUB === "1";

  function readCallback(): string {
    if (typeof window === "undefined") return "/";
    return safeCallback(
      new URLSearchParams(window.location.search).get("callbackUrl"),
    );
  }

  function rememberPostOnboarding(callbackUrl: string) {
    try {
      sessionStorage.setItem(POST_ONBOARDING_KEY, callbackUrl);
    } catch {
      /* ignore */
    }
  }

  async function magicLogin(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const callbackUrl = readCallback();
    rememberPostOnboarding(callbackUrl);
    const res = await signIn("resend", {
      email: email.trim(),
      redirect: false,
      callbackUrl,
    });
    setPending(false);
    if (res?.error) {
      setError(
        "メールを送れませんでした。アドレスを確認するか、しばらくしてから再試行してください。",
      );
      return;
    }
    const q = new URLSearchParams({ email: email.trim() });
    window.location.href = `/login/check-email?${q.toString()}`;
  }

  async function demoLogin(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const callbackUrl = readCallback();
    rememberPostOnboarding(callbackUrl);
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
      <SiteHeader hidePostCta hideAccountActions />
      <main className="px-4 py-8">
        <h1 className="text-xl font-semibold text-viscum-ink">ログイン</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
          見る・読むは登録なしのままです。ログインすると、自分用のダッシュボードと、シード／書く／払う／PFコメントが使えます。
        </p>

        {magicLinkUi ? (
          <form onSubmit={magicLogin} className="mt-8 space-y-4">
            <div>
              <label className="text-[13px] font-medium text-viscum-ink">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] focus:border-viscum-brand focus:outline-none"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {error && (
              <p className="text-[13px] text-viscum-berry-deep">{error}</p>
            )}
            <button
              type="submit"
              disabled={pending || !email.trim()}
              className="w-full rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
            >
              {pending ? "送信中…" : "ログインリンクを送る"}
            </button>
            <p className="text-[11px] leading-relaxed text-viscum-muted">
              パスワードはありません。届いたメールのリンクから入れます。英語ID（コテハン）は初回だけ決めます。
            </p>
          </form>
        ) : (
          <p className="mt-8 text-[13px] text-viscum-muted">
            メールログインは準備中です。デモログインを使ってください。
          </p>
        )}

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

        <div className="mt-8 border-t border-viscum-line pt-6">
          <button
            type="button"
            className="text-[12px] text-viscum-muted underline-offset-2 hover:text-viscum-ink hover:underline"
            onClick={() => setShowDemo((v) => !v)}
          >
            {showDemo ? "デモログインを閉じる" : "デモログイン（開発・友人検証）"}
          </button>
          {showDemo && (
            <form onSubmit={demoLogin} className="mt-4 space-y-3">
              <div>
                <label className="text-[13px] font-medium text-viscum-ink">
                  英語ID（デモ）
                </label>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] focus:border-viscum-brand focus:outline-none"
                  placeholder="tori"
                  autoComplete="username"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md border border-viscum-line bg-white/70 px-4 py-2.5 text-sm font-medium text-viscum-ink hover:bg-viscum-paper-2 disabled:opacity-50"
              >
                {pending ? "入っています…" : "デモログイン"}
              </button>
            </form>
          )}
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
