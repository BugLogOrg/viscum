"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { clearAccountLocalData } from "@/lib/clear-account-local";
import {
  readNotifyPrefs,
  writeNotifyPrefs,
  type NotifyPrefs,
} from "@/lib/local-notifies";

/** 設定のまとめページ（通知など）。公開プロフィール編集は別 */
export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [prefs, setPrefs] = useState<NotifyPrefs>({
    seederAlerts: true,
    mentorParticipateAlerts: false,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";

  useEffect(() => {
    setPrefs(readNotifyPrefs());
  }, []);

  async function deleteAccount() {
    if (!handle || confirmText.trim().toLowerCase() !== handle.toLowerCase()) {
      setDeleteError("英語IDを正確に入力してください。");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setDeleteError(data.error || `削除に失敗しました（${res.status}）`);
        setDeleting(false);
        return;
      }
      clearAccountLocalData(handle);
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("ネットワークエラーです。もう一度お試しください。");
      setDeleting(false);
    }
  }

  if (status === "loading") {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
        <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      </BrowseChrome>
    );
  }

  if (!session?.user) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">設定</h1>
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

  return (
    <BrowseChrome>
      <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-6 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">設定</h1>
          <p className="mt-1 text-[12px] text-viscum-muted">
            アカウントまわりの設定をここにまとめます。
          </p>
        </div>

        <section className="rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
          <p className="text-[13px] font-semibold text-viscum-ink">プロフィール</p>
          <p className="mt-1 text-[11px] text-viscum-muted">
            アイコン・一言など、公開に出る情報
          </p>
          <Link
            href="/dashboard/profile"
            className="mt-3 flex w-full items-center justify-center rounded-md border border-viscum-brand px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
          >
            プロフィールを編集
          </Link>
        </section>

        <section className="rounded-lg border border-viscum-line bg-white/70 px-3 py-3 space-y-3">
          <div>
            <p className="text-[13px] font-semibold text-viscum-ink">通知</p>
            <p className="mt-1 text-[11px] leading-relaxed text-viscum-muted">
              初期はシーダー向けが主。メンター参加の追跡はオフが既定です。
            </p>
          </div>
          <label className="flex items-start gap-2.5 text-[13px] text-viscum-ink">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={prefs.seederAlerts}
              onChange={(e) => {
                const next = { ...prefs, seederAlerts: e.target.checked };
                writeNotifyPrefs(next);
                setPrefs(next);
              }}
            />
            <span>
              <span className="font-medium">シーダー向け</span>
              <span className="mt-0.5 block text-[11px] text-viscum-muted">
                コメント・締切・フォロー・チップ受取など
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-[13px] text-viscum-ink">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={prefs.mentorParticipateAlerts}
              onChange={(e) => {
                const next = {
                  ...prefs,
                  mentorParticipateAlerts: e.target.checked,
                };
                writeNotifyPrefs(next);
                setPrefs(next);
              }}
            />
            <span>
              <span className="font-medium">メンター参加の通知</span>
              <span className="mt-0.5 block text-[11px] text-viscum-muted">
                フォロー中メンターが別作品に参加したとき。賞金レーダーになりやすいので初期OFF。必要な人だけON。
              </span>
            </span>
          </label>
          <Link
            href="/dashboard/notifications"
            className="inline-block text-[12px] text-viscum-brand underline"
          >
            通知一覧へ
          </Link>
        </section>

        <section className="rounded-lg border border-viscum-berry/35 bg-viscum-berry/5 px-3 py-3 space-y-3">
          <div>
            <p className="text-[13px] font-semibold text-viscum-berry-deep">
              アカウント削除
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-viscum-muted">
              プロフィール・ログイン連携・あなたが並べたシードを消します。元に戻せません。
            </p>
          </div>

          {!confirmOpen ? (
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(true);
                setConfirmText("");
                setDeleteError(null);
              }}
              className="flex w-full items-center justify-center rounded-md border border-viscum-berry-deep px-3 py-2.5 text-sm font-medium text-viscum-berry-deep hover:bg-viscum-berry/10"
            >
              アカウントを削除
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] leading-relaxed text-viscum-ink">
                確認のため、英語ID{" "}
                <span className="font-mono font-medium">@{handle || "—"}</span>{" "}
                を入力してください。
              </p>
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={handle || "英語ID"}
                className="w-full rounded-md border border-viscum-line bg-white px-3 py-2 text-sm text-viscum-ink outline-none focus:border-viscum-berry"
              />
              {deleteError ? (
                <p className="text-[12px] text-viscum-berry-deep">{deleteError}</p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setConfirmOpen(false);
                    setConfirmText("");
                    setDeleteError(null);
                  }}
                  className="flex-1 rounded-md border border-viscum-line px-3 py-2.5 text-sm text-viscum-ink hover:bg-white/80 disabled:opacity-50"
                >
                  やめる
                </button>
                <button
                  type="button"
                  disabled={
                    deleting ||
                    !handle ||
                    confirmText.trim().toLowerCase() !== handle.toLowerCase()
                  }
                  onClick={() => void deleteAccount()}
                  className="flex-1 rounded-md bg-viscum-berry-deep px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry disabled:opacity-45"
                >
                  {deleting ? "削除中…" : "完全に削除する"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </BrowseChrome>
  );
}
