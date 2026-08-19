"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fileToAvatarDataUrl,
  readLocalProfile,
  writeLocalProfile,
} from "@/lib/local-profile";

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handle = session?.user?.handle;

  useEffect(() => {
    if (!handle) return;
    const p = readLocalProfile(handle);
    setBio(p?.bio ?? "");
    setAvatar(p?.avatarDataUrl ?? null);
  }, [handle]);

  if (status === "loading") {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard/settings" hideOnMd hidePostCta />
        <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      </BrowseChrome>
    );
  }

  if (!session?.user || !handle) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">
            プロフィール編集
          </h1>
          <p className="mt-2 text-[14px] text-viscum-muted">
            ログインが必要です。
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white"
          >
            ログインへ
          </Link>
        </main>
      </BrowseChrome>
    );
  }

  function persist(next: { bio?: string; avatarDataUrl?: string | null }) {
    const prev = readLocalProfile(handle!) ?? {
      handle: handle!,
      bio: "",
      updatedAt: new Date().toISOString(),
    };
    const avatarDataUrl =
      next.avatarDataUrl === null
        ? undefined
        : (next.avatarDataUrl ?? prev.avatarDataUrl);
    writeLocalProfile({
      handle: handle!,
      bio: (next.bio ?? prev.bio).trim().slice(0, 200),
      avatarDataUrl,
      updatedAt: new Date().toISOString(),
    });
    window.dispatchEvent(new Event("viscum-profile-updated"));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    persist({ bio });
    setSaved(true);
    setError(null);
  }

  async function onPickFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatar(dataUrl);
      persist({ bio, avatarDataUrl: dataUrl });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <BrowseChrome>
      <SiteHeader backHref="/dashboard/settings" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-6 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">
            プロフィール編集
          </h1>
          <p className="mt-1 text-[12px] text-viscum-muted">
            デモ段階は端末内に保存。ハンドルはログイン名のままです。通知などの設定は
            <Link href="/dashboard/settings" className="text-viscum-brand underline">
              設定
            </Link>
            へ。
          </p>
        </div>

        <form onSubmit={save} className="space-y-5">
          <div className="space-y-2">
            <p className="text-[12px] text-viscum-muted">アイコン</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-viscum-line bg-viscum-berry text-2xl font-semibold text-white hover:opacity-90 disabled:opacity-60"
                title="画像を選ぶ"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  handle.slice(0, 1).toUpperCase()
                )}
              </button>
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
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md border border-viscum-brand px-3 py-2 text-[13px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft disabled:opacity-60"
                >
                  {busy ? "処理中…" : "画像をアップロード"}
                </button>
                {avatar && (
                  <button
                    type="button"
                    className="ml-2 text-[12px] text-viscum-muted underline"
                    onClick={() => {
                      setAvatar(null);
                      persist({ bio, avatarDataUrl: null });
                      setSaved(true);
                    }}
                  >
                    削除
                  </button>
                )}
                <p className="text-[11px] leading-relaxed text-viscum-muted">
                  正方形に切り抜いて端末内に保存します（本番はサーバ保管へ）。
                </p>
              </div>
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-[12px] text-viscum-muted">ハンドル</span>
            <input
              value={`@${handle}`}
              readOnly
              className="w-full rounded-md border border-viscum-line bg-viscum-paper-2 px-3 py-2 text-[14px] text-viscum-muted"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[12px] text-viscum-muted">一言（公開）</span>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setSaved(false);
              }}
              rows={3}
              maxLength={200}
              placeholder="何をシードしている人か、一行で"
              className="w-full resize-y rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-[14px] text-viscum-ink outline-none focus:border-viscum-brand"
            />
          </label>
          {error && (
            <p className="text-[12px] text-viscum-berry-deep">{error}</p>
          )}
          {saved && !error && (
            <p className="text-[13px] text-viscum-brand">保存しました</p>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
          >
            保存する
          </button>
        </form>

        <p className="text-center text-sm">
          <Link
            href={`/u/${encodeURIComponent(handle)}`}
            className="text-viscum-brand underline"
          >
            公開ポートフォリオを見る
          </Link>
        </p>
      </main>
    </BrowseChrome>
  );
}
