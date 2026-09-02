"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { rememberPendingLoginEmail } from "@/lib/pending-login-email";
import {
  describePostLoginDestination,
  onboardingHandleHref,
  onboardingWelcomeHref,
  readPostLoginDestination,
  rememberPostLoginDestination,
  safeInternalPath,
} from "@/lib/post-login-destination";

function safeCallback(raw: string | null): string {
  return safeInternalPath(raw) ?? "/";
}

const magicLinkUi = process.env.NEXT_PUBLIC_AUTH_MAGIC_LINK !== "0";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("guest");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [destHint, setDestHint] = useState<string | null>(null);
  const githubEnabled = process.env.NEXT_PUBLIC_AUTH_GITHUB === "1";
  const reservedDemoHint =
    "tori / ayu など棚デモ用の英語IDは使えません。guest や自分用のIDにしてください。";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cb = safeCallback(params.get("callbackUrl"));
    if (cb !== "/") rememberPostLoginDestination(cb);
    else {
      // error=Verification で callback が落ちても、覚えていた招待先を復元
      const remembered = readPostLoginDestination("/");
      if (remembered !== "/") {
        setDestHint(describePostLoginDestination(remembered));
        // アドレスバーにも残す（再送時に使える）
        if (!params.get("callbackUrl")) {
          const next = new URL(window.location.href);
          next.searchParams.set("callbackUrl", remembered);
          window.history.replaceState({}, "", next.toString());
        }
      }
    }
    if (cb !== "/") setDestHint(describePostLoginDestination(cb));

    const authError = params.get("error");
    if (authError === "Verification") {
      setError(
        "ログインリンクが無効か、期限切れです。メールの自動チェックで一度開かれた場合もあります。下からもう一度送ってください。",
      );
    } else if (authError === "OAuthAccountNotLinked") {
      setError(
        "このメールは別のログイン方法ですでに使われています。同じメールで送り直すか、以前の方法で入ってください。",
      );
    } else if (authError && authError !== "undefined") {
      setError("ログインに失敗しました。もう一度お試しください。");
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const cb = readCallback();
    if (cb !== "/") rememberPostLoginDestination(cb);
    if (session.user.needsHandle || !session.user.handle?.trim()) {
      router.replace(onboardingHandleHref(cb !== "/" ? cb : "/"));
      return;
    }
    if (session.user.needsOnboarding) {
      router.replace(onboardingWelcomeHref(cb !== "/" ? cb : null));
      return;
    }
    router.replace(cb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user]);

  function readCallback(): string {
    if (typeof window === "undefined") return "/";
    return safeCallback(
      new URLSearchParams(window.location.search).get("callbackUrl"),
    );
  }

  async function magicLogin(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const callbackUrl = readCallback();
    rememberPostLoginDestination(callbackUrl);
    const to = email.trim();
    rememberPendingLoginEmail(to);
    // メールリンク先に next を載せる（別タブでも戻り先が残る）
    const res = await signIn("resend", {
      email: to,
      redirect: false,
      callbackUrl: onboardingHandleHref(callbackUrl),
    });
    setPending(false);
    if (res?.error) {
      setError(
        "メールを送れませんでした。アドレスを確認するか、しばらくしてから再試行してください。",
      );
      return;
    }
    const q = new URLSearchParams({ email: to });
    if (callbackUrl !== "/") q.set("next", callbackUrl);
    window.location.href = `/login/check-email?${q.toString()}`;
  }

  async function demoLogin(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const callbackUrl = readCallback();
    rememberPostLoginDestination(callbackUrl);
    const res = await signIn("demo", {
      handle,
      redirect: false,
      callbackUrl,
    });
    setPending(false);
    if (res?.error) {
      setError(
        `ログインに失敗しました。デモログインが無効か、${reservedDemoHint}`,
      );
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
          見る・読むは登録なしのままです。ログインすると、自分用のダッシュボードと、シード／書く／払う／受け取る／PFコメントが使えます。
        </p>
        {destHint ? (
          <p className="mt-3 rounded-md border border-viscum-brand/30 bg-viscum-leaf-soft/40 px-3 py-2 text-[13px] leading-relaxed text-viscum-ink">
            {destHint}
          </p>
        ) : null}

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
              disabled={pending}
              className="w-full rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
            >
              {pending ? "送信中…" : "ログイン用リンクを送る"}
            </button>
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
            onClick={() => {
              const callbackUrl = readCallback();
              rememberPostLoginDestination(callbackUrl);
              void signIn("github", {
                callbackUrl: onboardingHandleHref(callbackUrl),
              });
            }}
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
                  placeholder="guest"
                  autoComplete="username"
                />
                <p className="mt-1 text-[11px] leading-relaxed text-viscum-muted">
                  {reservedDemoHint}
                </p>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md border border-viscum-line bg-white/70 px-4 py-2.5 text-sm font-medium text-viscum-ink hover:bg-viscum-paper-2 disabled:opacity-50"
              >
                {pending ? "入っています…" : "デモログイン"}
              </button>
              {error && (
                <p className="text-[13px] text-viscum-berry-deep">{error}</p>
              )}
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
