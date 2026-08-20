"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fetchRemoteProfile,
  fileToAvatarDataUrl,
  normalizeAccountName,
  readLocalProfile,
  rememberAccountName,
  saveRemoteProfile,
  writeLocalProfile,
} from "@/lib/local-profile";
import { syncSeederAccountNameOnSeeds } from "@/lib/local-seeds";

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const [accountName, setAccountName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverSynced, setServerSynced] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handle = session?.user?.handle;

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    (async () => {
      const local = readLocalProfile(handle);
      const remote = await fetchRemoteProfile(handle);
      if (cancelled) return;
      if (remote?.persisted && (remote.accountName || remote.bio || remote.image)) {
        setAccountName(remote.accountName?.trim() || local?.accountName || "");
        setBio(remote.bio ?? local?.bio ?? "");
        setAvatar(remote.image ?? local?.avatarDataUrl ?? null);
        setServerSynced(true);
        writeLocalProfile({
          handle,
          accountName: remote.accountName?.trim() || undefined,
          bio: remote.bio ?? "",
          avatarDataUrl: remote.image ?? undefined,
          updatedAt: new Date().toISOString(),
        });
        return;
      }
      setServerSynced(false);
      setAccountName(local?.accountName?.trim() ? local.accountName : "");
      setBio(local?.bio ?? "");
      setAvatar(local?.avatarDataUrl ?? null);
    })();
    return () => {
      cancelled = true;
    };
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

  function persistLocal(next: {
    accountName?: string;
    bio?: string;
    avatarDataUrl?: string | null;
  }) {
    const prev = readLocalProfile(handle!) ?? {
      handle: handle!,
      bio: "",
      updatedAt: new Date().toISOString(),
    };
    const avatarDataUrl =
      next.avatarDataUrl === null
        ? undefined
        : (next.avatarDataUrl ?? prev.avatarDataUrl);
    const nextName =
      next.accountName !== undefined
        ? normalizeAccountName(next.accountName)
        : (prev.accountName ?? "");
    writeLocalProfile({
      handle: handle!,
      accountName: nextName || undefined,
      bio: (next.bio ?? prev.bio).trim().slice(0, 500),
      avatarDataUrl,
      updatedAt: new Date().toISOString(),
    });
    if (nextName) {
      rememberAccountName(handle!, nextName);
      syncSeederAccountNameOnSeeds(handle!, nextName);
    }
    window.dispatchEvent(new Event("viscum-profile-updated"));
  }

  async function persistAll(next: {
    accountName: string;
    bio: string;
    avatarDataUrl?: string | null;
  }) {
    persistLocal(next);
    const image =
      next.avatarDataUrl === null
        ? null
        : (next.avatarDataUrl ?? avatar ?? undefined);
    const remote = await saveRemoteProfile({
      accountName: next.accountName,
      bio: next.bio,
      image: image === undefined ? undefined : image,
    });
    setServerSynced(remote.persisted);
    if (!remote.ok) {
      setError(remote.error || "サーバ保存に失敗（端末内には保存済み）");
      return false;
    }
    return true;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const name = normalizeAccountName(accountName);
    if (!name) {
      setError(
        "アカウント名を入れてください（メールの「さん」や公開の顔になります）",
      );
      setSaved(false);
      return;
    }
    setBusy(true);
    setError(null);
    const ok = await persistAll({ accountName: name, bio, avatarDataUrl: avatar });
    setAccountName(name);
    setSaved(ok);
    setBusy(false);
  }

  async function onPickFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatar(dataUrl);
      const name = normalizeAccountName(accountName);
      if (!name) {
        persistLocal({ avatarDataUrl: dataUrl });
        setError("アイコンは端末に保存しました。アカウント名を入れて保存してください");
      } else {
        await persistAll({
          accountName: name,
          bio,
          avatarDataUrl: dataUrl,
        });
        setSaved(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const previewName = normalizeAccountName(accountName) || handle;

  return (
    <BrowseChrome>
      <SiteHeader backHref="/dashboard/settings" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-6 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">
            プロフィール編集
          </h1>
          <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
            {serverSynced
              ? "サーバに同期済み（モバイルとWebで共有できます）。"
              : "いまは端末内保存です。スマホとPCは別々になります。Neon（DATABASE_URL）接続後に横断同期できます。"}{" "}
            通知などの設定は
            <Link href="/dashboard/settings" className="text-viscum-brand underline">
              設定
            </Link>
            へ。
          </p>
        </div>

        <form onSubmit={(e) => void save(e)} className="space-y-5">
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
                  previewName.slice(0, 1).toUpperCase()
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
                      void persistAll({
                        accountName:
                          normalizeAccountName(accountName) || handle,
                        bio,
                        avatarDataUrl: null,
                      });
                      setSaved(true);
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-[12px] text-viscum-muted">
              英語ID（認識用・変更不可）
            </span>
            <input
              value={`@${handle}`}
              readOnly
              className="w-full rounded-md border border-viscum-line bg-viscum-paper-2 px-3 py-2 text-[14px] text-viscum-muted"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[12px] text-viscum-muted">アカウント名</span>
            <input
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                setSaved(false);
                setError(null);
              }}
              maxLength={40}
              placeholder="例: 観察の鳥"
              className="w-full rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-[14px] text-viscum-ink outline-none focus:border-viscum-brand"
            />
            <span className="block text-[11px] leading-relaxed text-viscum-muted">
              公開の顔・直依頼メールの送り主（「さん」）に使います。
              {accountName.trim()
                ? ` プレビュー: ${previewName} さん（@${handle}）`
                : null}
            </span>
          </label>

          <label className="block space-y-1">
            <span className="text-[12px] text-viscum-muted">一言（公開）</span>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setSaved(false);
              }}
              rows={5}
              maxLength={500}
              placeholder={
                "何をシードしている人か。改行OK。\nhttps://… のURLはリンクになります"
              }
              className="w-full resize-y rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-[14px] text-viscum-ink outline-none focus:border-viscum-brand"
            />
            <span className="block text-[11px] leading-relaxed text-viscum-muted">
              改行はそのまま表示。http(s)のURLは自動でリンクになります（{bio.length}/500）
            </span>
          </label>
          {error && (
            <p className="text-[12px] text-viscum-berry-deep">{error}</p>
          )}
          {saved && !error && (
            <p className="text-[13px] text-viscum-brand">
              保存しました
              {serverSynced ? "（サーバ同期）" : "（この端末のみ）"}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-60"
          >
            保存する
          </button>
        </form>

        <p className="text-center text-sm">
          <Link
            href={`/u/${encodeURIComponent(handle)}`}
            className="text-viscum-brand underline"
          >
            プロフィールを見る
          </Link>
        </p>
      </main>
    </BrowseChrome>
  );
}
