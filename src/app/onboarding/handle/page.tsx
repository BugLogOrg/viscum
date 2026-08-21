"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fileToAvatarDataUrl,
  normalizeAccountName,
  rememberAccountName,
  writeLocalProfile,
} from "@/lib/local-profile";

/** ログイン直後のウェルカム＝英語ID＋公開プロフィールの初回設定 */
export default function OnboardingHandlePage() {
  const { data, update, status } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [handle, setHandle] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (data?.user?.email) {
      setLoginEmail(data.user.email);
      return;
    }
    let cancelled = false;
    void fetch("/api/account/email")
      .then((r) => r.json())
      .then((j: { email?: string | null }) => {
        if (!cancelled && j.email) setLoginEmail(j.email);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status, data?.user?.email]);

  async function onPickFile(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatar(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像の読み込みに失敗しました");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = normalizeAccountName(accountName);
    if (!name) {
      setError("アカウント名を入れてください（公開の顔・「さん」表記に使います）");
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch("/api/profile/handle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        accountName: name,
        bio,
        image: avatar,
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      message?: string;
      error?: string;
      handle?: string;
      accountName?: string;
      bio?: string;
    } | null;
    setPending(false);
    if (!res.ok) {
      if (
        json?.error === "handle taken" ||
        json?.error === "handle reserved" ||
        /使われて|already|taken|存在|デモ棚/i.test(json?.message ?? "")
      ) {
        setError(
          json?.message ||
            "この英語IDはすでに使われています。別のものを選んでください",
        );
      } else {
        setError(json?.message || "設定に失敗しました。もう一度お試しください");
      }
      return;
    }
    const savedHandle = json?.handle || handle;
    const savedName = json?.accountName || name;
    writeLocalProfile({
      handle: savedHandle,
      accountName: savedName,
      bio: json?.bio ?? bio,
      avatarDataUrl: avatar ?? undefined,
      updatedAt: new Date().toISOString(),
    });
    rememberAccountName(savedHandle, savedName);
    await update({ handle: savedHandle });
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

  const previewName = normalizeAccountName(accountName) || handle || "…";
  const glyph = (previewName || "?").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader hidePostCta hideAccountActions />
      <main className="px-4 py-10">
        <p className="text-[12px] font-medium tracking-wide text-viscum-brand">
          WELCOME
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-viscum-ink">
          VISCUMへようこそ
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-viscum-muted">
          はじめに公開プロフィールを整えてください。英語IDはあとから変えられません。アカウント名・プロフィールはいつでも編集できます。
        </p>

        <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-5">
          <div className="space-y-2">
            <p className="text-[12px] text-viscum-muted">アイコン（任意）</p>
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-viscum-berry text-xl font-semibold text-white"
                aria-hidden
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  glyph
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md border border-viscum-brand px-3 py-2 text-[13px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft disabled:opacity-60"
                >
                  画像をアップロード
                </button>
                {avatar ? (
                  <button
                    type="button"
                    className="ml-2 text-[12px] text-viscum-muted underline"
                    onClick={() => setAvatar(null)}
                  >
                    削除
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-viscum-ink">
              英語ID（変更不可）
            </label>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[14px] text-viscum-muted">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] focus:border-viscum-brand focus:outline-none"
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                minLength={2}
                inputMode="text"
              />
            </div>
            <p className="mt-1 text-[11px] text-viscum-muted">
              URL・コメントのコテハン。英数字と _ のみ・2〜24文字
            </p>
          </div>

          <div>
            <label className="text-[13px] font-medium text-viscum-ink">
              アカウント名
            </label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              maxLength={40}
              required
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] focus:border-viscum-brand focus:outline-none"
              placeholder=""
              autoComplete="nickname"
            />
            <p className="mt-1 text-[11px] leading-relaxed text-viscum-muted">
              公開の顔・直依頼メールの送り主（「さん」）に使います。
              {normalizeAccountName(accountName) || handle
                ? ` プレビュー: ${previewName} さん（@${handle || "…"}）`
                : null}
            </p>
          </div>

          <div>
            <label className="text-[13px] font-medium text-viscum-ink">
              プロフィール（公開）
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              rows={4}
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] leading-relaxed focus:border-viscum-brand focus:outline-none"
              placeholder="何をシードしている人か。改行OK。https://... のURLはリンクになります"
            />
            <p className="mt-1 text-[11px] text-viscum-muted">
              あとから設定でも書けます（{bio.length}/500）
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
            {pending ? "保存中…" : "この内容で始める"}
          </button>
        </form>

        <div className="mt-8 space-y-2 border-t border-viscum-line pt-5">
          {loginEmail ? (
            <p className="text-[12px] text-viscum-muted">
              ログイン中のメール：
              <span className="ml-1 text-viscum-ink">{loginEmail}</span>
            </p>
          ) : (
            <p className="text-[12px] text-viscum-muted">
              ログインメールを確認中…
            </p>
          )}
          <p className="text-[11px] text-viscum-muted">
            メール変更は設定完了後の設定画面から。別アドレスで入り直す場合は{" "}
            <button
              type="button"
              className="text-viscum-brand underline"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              ログアウト
            </button>
            。
          </p>
          <p className="text-[11px] text-viscum-muted">
            <Link href="/lp" className="text-viscum-brand underline">
              LPを見る
            </Link>
          </p>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
