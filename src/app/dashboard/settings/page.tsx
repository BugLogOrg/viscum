"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  return (
    <Suspense
      fallback={
        <BrowseChrome>
          <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
          <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
            読み込み中…
          </div>
        </BrowseChrome>
      }
    >
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const [prefs, setPrefs] = useState<NotifyPrefs>({
    seederAlerts: true,
    mentorParticipateAlerts: true,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const handle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";

  useEffect(() => {
    setPrefs(readNotifyPrefs());
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void fetch("/api/account/email")
      .then((r) => r.json())
      .then((data: { email?: string | null; demo?: boolean }) => {
        if (cancelled) return;
        setEmail(data.email ?? session?.user?.email ?? null);
        setEmailDraft(data.email ?? session?.user?.email ?? "");
        setIsDemo(Boolean(data.demo));
      })
      .catch(() => {
        if (cancelled) return;
        setEmail(session?.user?.email ?? null);
        setEmailDraft(session?.user?.email ?? "");
      });
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.email]);

  useEffect(() => {
    const flag = searchParams.get("email");
    if (!flag) return;
    if (flag === "ok") {
      setEmailMsg(
        "メールアドレスを更新しました。次回ログインから新しいアドレスを使えます。",
      );
      void fetch("/api/account/email")
        .then((r) => r.json())
        .then(async (data: { email?: string | null }) => {
          if (data.email) {
            setEmail(data.email);
            setEmailDraft(data.email);
            await update({ email: data.email });
          }
        });
    } else if (flag === "expired") {
      setEmailErr("確認リンクの期限が切れました。もう一度送ってください。");
    } else if (flag === "taken") {
      setEmailErr("そのメールは別アカウントで使われています。");
    } else if (flag === "invalid") {
      setEmailErr("確認リンクが無効です。");
    } else if (flag === "error") {
      setEmailErr("メール変更に失敗しました。");
    }
  }, [searchParams, update]);

  async function requestEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMsg(null);
    setEmailErr(null);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailDraft }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        sentTo?: string;
      };
      if (!res.ok) {
        setEmailErr(data.message || "変更リクエストに失敗しました");
        setEmailBusy(false);
        return;
      }
      setEmailMsg(
        `確認メールを ${data.sentTo || emailDraft} に送りました。メール内のリンクを開いてください。`,
      );
    } catch {
      setEmailErr("ネットワークエラーです");
    }
    setEmailBusy(false);
  }

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
            アイコン・プロフィールなど、公開に出る情報
          </p>
          <Link
            href="/dashboard/profile"
            className="mt-3 flex w-full items-center justify-center rounded-md border border-viscum-brand px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
          >
            プロフィールを編集
          </Link>
        </section>

        <section className="space-y-3 rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
          <div>
            <p className="text-[13px] font-semibold text-viscum-ink">
              ログインメール
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-viscum-muted">
              Magic Link の送り先です。変更すると新しいアドレスに確認メールが届きます。
            </p>
          </div>
          <p className="text-[13px] text-viscum-ink">
            いまのアドレス：
            <span className="ml-1 font-medium">{email || "（未取得）"}</span>
          </p>
          {isDemo ? (
            <p className="text-[12px] text-viscum-muted">
              デモログイン中のためメール変更はできません。
            </p>
          ) : (
            <form
              onSubmit={(e) => void requestEmailChange(e)}
              className="space-y-2"
            >
              <label className="block text-[12px] font-medium text-viscum-ink">
                新しいメールアドレス
              </label>
              <input
                type="email"
                required
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                className="w-full rounded-md border border-viscum-line bg-white px-3 py-2 text-sm text-viscum-ink outline-none focus:border-viscum-brand"
                autoComplete="email"
              />
              {emailMsg ? (
                <p className="text-[12px] text-viscum-brand">{emailMsg}</p>
              ) : null}
              {emailErr ? (
                <p className="text-[12px] text-viscum-berry-deep">{emailErr}</p>
              ) : null}
              <button
                type="submit"
                disabled={emailBusy}
                className="w-full rounded-md border border-viscum-brand px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft disabled:opacity-50"
              >
                {emailBusy ? "送信中…" : "確認メールを送る"}
              </button>
            </form>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
          <div>
            <p className="text-[13px] font-semibold text-viscum-ink">通知</p>
            <p className="mt-1 text-[11px] leading-relaxed text-viscum-muted">
              場を盛り上げるため、メンター参加も既定で届けます。専業シーダーなど不要ならオフに。
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
                コメント・締切・フォロー・チップ受取・フォロー中のシード公開など
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
                フォロー中の人が別作品にコメントしたとき。ライバルが増えて場が動くので既定ON。いらない人だけオフ。
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

        <section className="space-y-3 rounded-lg border border-viscum-berry/35 bg-viscum-berry/5 px-3 py-3">
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
