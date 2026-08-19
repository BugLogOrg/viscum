"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  readLocalProfile,
  writeLocalProfile,
} from "@/lib/local-profile";

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  const handle = session?.user?.handle;

  useEffect(() => {
    if (!handle) return;
    const p = readLocalProfile(handle);
    setBio(p?.bio ?? "");
  }, [handle]);

  if (status === "loading") {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper px-4 py-10 text-sm text-viscum-muted">
        読み込み中…
      </div>
    );
  }

  if (!session?.user || !handle) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
        <SiteHeader backHref="/" />
        <main className="px-4 py-10">
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
      </div>
    );
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!handle) return;
    writeLocalProfile({
      handle,
      bio: bio.trim().slice(0, 200),
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/me" hidePostCta />
      <main className="space-y-6 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">
            プロフィール編集
          </h1>
          <p className="mt-1 text-[12px] text-viscum-muted">
            デモ段階は端末内に保存。ハンドルはログイン名のままです。
          </p>
        </div>

        <form onSubmit={save} className="space-y-4">
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
          {saved && (
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
    </div>
  );
}
