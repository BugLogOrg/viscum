"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DEMO_SPECIALTIES } from "@/data/specialties";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SuggestFollows } from "@/components/SuggestFollows";

const POST_KEY = "viscum.postOnboarding";

function readPostPath(): string {
  if (typeof window === "undefined") return "/";
  try {
    const raw = sessionStorage.getItem(POST_KEY);
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  } catch {
    /* ignore */
  }
  return "/";
}

function WelcomeBody() {
  const { data, update, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preview = searchParams.get("preview") === "1";
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSkipGate = useMemo(
    () => status === "authenticated" && !data?.user?.needsHandle,
    [status, data?.user?.needsHandle],
  );

  // リダイレクトは effect のみ。preview 中は絶対に飛ばさない（セッション確定で消えるのを防ぐ）
  useEffect(() => {
    if (preview) return;
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (data?.user?.needsHandle) {
      router.replace("/onboarding/handle");
      return;
    }
    if (data?.user && !data.user.needsOnboarding && canSkipGate) {
      const next = readPostPath();
      router.replace(next === "/dashboard" ? "/" : next);
    }
  }, [
    preview,
    status,
    data?.user,
    data?.user?.needsHandle,
    data?.user?.needsOnboarding,
    canSkipGate,
    router,
  ]);

  async function finish(specialties: string[], skip: boolean) {
    if (preview) {
      router.replace("/");
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialties, skip }),
    });
    setPending(false);
    if (!res.ok) {
      setError("保存に失敗しました。もう一度試してください。");
      return;
    }
    await update({ onboardingDone: true });
    let next = "/";
    try {
      const raw = sessionStorage.getItem(POST_KEY);
      if (raw && raw.startsWith("/") && !raw.startsWith("//")) next = raw;
      sessionStorage.removeItem(POST_KEY);
    } catch {
      /* ignore */
    }
    router.replace(next === "/dashboard" ? "/" : next);
    router.refresh();
  }

  function toggle(tag: string) {
    setPicked((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  const displayName =
    data?.user?.name?.trim() ||
    (data?.user?.handle ? `@${data.user.handle}` : "");

  // preview 以外で「もう完了」なら effect で飛ぶまでの待ち
  if (
    !preview &&
    status === "authenticated" &&
    data?.user &&
    !data.user.needsOnboarding &&
    canSkipGate
  ) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center bg-viscum-paper text-sm text-viscum-muted">
        棚へ…
      </div>
    );
  }

  if (!preview && status === "unauthenticated") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center bg-viscum-paper text-sm text-viscum-muted">
        ログインへ…
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/" hidePostCta />
      <main className="px-4 py-8">
        {preview && (
          <p className="mb-4 rounded-md bg-viscum-leaf-soft/50 px-3 py-2 text-[11px] text-viscum-muted">
            プレビュー表示（このまま残ります・保存しません）
          </p>
        )}
        <p className="text-[12px] font-medium tracking-wide text-viscum-brand">
          はじめてのVISCUM
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-viscum-ink sm:text-5xl">
          ようこそ
          {displayName ? (
            <>
              <br />
              <span className="text-[0.55em] font-medium text-viscum-muted">
                {displayName}
              </span>
            </>
          ) : null}
        </h1>
        <h2 className="mt-8 text-lg font-semibold text-viscum-ink">
          気になる専門はありますか？
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
          選ばなくても棚は見られます。選ぶと、あとからの通知や見つけやすさの材料になります（準備中）。スキップ可。
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {DEMO_SPECIALTIES.map((tag) => {
            const on = picked.includes(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => toggle(tag)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                    on
                      ? "bg-viscum-berry text-white"
                      : "bg-viscum-paper-2 text-viscum-ink hover:bg-viscum-leaf-soft"
                  }`}
                  aria-pressed={on}
                >
                  {tag}
                </button>
              </li>
            );
          })}
        </ul>

        <SuggestFollows />

        {error && (
          <p className="mt-4 text-[13px] text-viscum-berry-deep">{error}</p>
        )}

        <div className="mt-8 space-y-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => void finish(picked, false)}
            className="w-full rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
          >
            {pending ? "保存中…" : preview ? "棚へ戻る" : "棚を見にいく"}
          </button>
          {!preview && (
            <button
              type="button"
              disabled={pending}
              onClick={() => void finish([], true)}
              className="w-full rounded-md border border-viscum-line bg-white/70 px-4 py-2.5 text-sm font-medium text-viscum-muted hover:bg-viscum-paper-2 disabled:opacity-50"
            >
              スキップして棚へ
            </button>
          )}
        </div>

        <p className="mt-6 text-[12px] leading-relaxed text-viscum-muted">
          シーダー向けの成績ダッシュボードは、メニューの「ダッシュボード」からいつでも開けます。初回は棚からで大丈夫です。
        </p>
        <SiteFooter />
      </main>
    </div>
  );
}

export default function OnboardingWelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center bg-viscum-paper text-sm text-viscum-muted">
          読み込み中…
        </div>
      }
    >
      <WelcomeBody />
    </Suspense>
  );
}
