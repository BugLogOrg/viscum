"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function OnboardingHandlePage() {
  const { data, update, status } = useSession();
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/profile/handle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    const json = (await res.json().catch(() => null)) as {
      message?: string;
      handle?: string;
    } | null;
    setPending(false);
    if (!res.ok) {
      setError(json?.message || "設定に失敗しました");
      return;
    }
    await update({ handle: json?.handle });
    router.replace("/onboarding/welcome");
    router.refresh();
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  if (status === "authenticated" && data?.user && !data.user.needsHandle) {
    if (data.user.needsOnboarding) {
      router.replace("/onboarding/welcome");
    } else {
      router.replace("/");
    }
    return null;
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader hidePostCta hideAccountActions />
      <main className="px-4 py-8">
        <h1 className="text-xl font-semibold text-viscum-ink">英語IDを決める</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
          URL・PFコメントのコテハンになります。あとからの変更は重いので、ここで一度決めてください。公開の呼び名（アカウント名）は次のプロフィールで設定できます。
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-viscum-ink">
              英語ID
            </label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] focus:border-viscum-brand focus:outline-none"
              placeholder="tori"
              autoComplete="username"
              required
              minLength={2}
            />
            <p className="mt-1 text-[11px] text-viscum-muted">
              英数字と _ のみ・2〜24文字
            </p>
          </div>
          {error && (
            <p className="text-[13px] text-viscum-berry-deep">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
          >
            {pending ? "保存中…" : "このIDで始める"}
          </button>
        </form>
        <SiteFooter />
      </main>
    </div>
  );
}
