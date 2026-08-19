"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DEMO_SPECIALTIES } from "@/data/specialties";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

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

export default function OnboardingWelcomePage() {
  const { data, update, status } = useSession();
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSkipGate = useMemo(
    () => status === "authenticated" && !data?.user?.needsHandle,
    [status, data?.user?.needsHandle],
  );

  async function finish(specialties: string[], skip: boolean) {
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

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  if (status === "authenticated" && data?.user?.needsHandle) {
    router.replace("/onboarding/handle");
    return null;
  }

  if (
    status === "authenticated" &&
    data?.user &&
    !data.user.needsOnboarding &&
    canSkipGate
  ) {
    router.replace(readPostPath() === "/dashboard" ? "/" : readPostPath());
    return null;
  }

  function toggle(tag: string) {
    setPicked((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/" hidePostCta />
      <main className="px-4 py-8">
        <p className="text-[12px] font-medium tracking-wide text-viscum-brand">
          はじめてのVISCUM
        </p>
        <h1 className="mt-1 text-xl font-semibold text-viscum-ink">
          気になる専門はありますか？
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
          あとから変えられます。選ぶと、開催中の通知や見つけやすさの材料になります（準備中の機能含む）。スキップもできます。
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
            {pending ? "保存中…" : "棚を見にいく"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void finish([], true)}
            className="w-full rounded-md border border-viscum-line bg-white/70 px-4 py-2.5 text-sm font-medium text-viscum-muted hover:bg-viscum-paper-2 disabled:opacity-50"
          >
            スキップして棚へ
          </button>
        </div>

        <p className="mt-6 text-[12px] leading-relaxed text-viscum-muted">
          シーダー向けの成績ダッシュボードは、メニューの「ダッシュボード」からいつでも開けます。初回は棚からで大丈夫です。
        </p>
        <SiteFooter />
      </main>
    </div>
  );
}
