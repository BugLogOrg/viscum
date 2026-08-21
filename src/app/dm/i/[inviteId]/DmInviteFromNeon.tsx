"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";
import { ViscumMark } from "@/components/ViscumMark";
import { formatDateTime, formatYen } from "@/data/dummy-works";
import { postWorkComment } from "@/lib/remote-comments";
import { SeederCredibilityLink } from "@/components/SeederCredibilityLink";
import { accountLabelForHandle } from "@/data/suggested-seeders";

export type PublicDmInvite = {
  id: string;
  workId: string;
  workTitle: string;
  workExternalUrl?: string;
  workSummary?: string;
  amountYen: number;
  pitch?: string;
  fromHandle: string;
  fromAccountName?: string;
  createdAt?: string;
  closesAt?: string;
};

function splitSummary(raw: string): { description: string; prompts: string[] } {
  const text = raw.trim();
  if (!text) return { description: "", prompts: [] };
  const markers = ["【聞きたいこと】", "【聞くこと】"] as const;
  let marker = "";
  let i = -1;
  for (const m of markers) {
    const at = text.indexOf(m);
    if (at >= 0 && (i < 0 || at < i)) {
      i = at;
      marker = m;
    }
  }
  if (i < 0 || !marker) return { description: text, prompts: [] };
  return {
    description: text.slice(0, i).trim(),
    prompts: text
      .slice(i + marker.length)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/**
 * Neon 招待スナップショット着地。local_* でも別端末で開ける。
 */
export function DmInviteFromNeon({ inviteId }: { inviteId: string }) {
  const { data: session, status: authStatus } = useSession();
  const handle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";
  const canWrite = Boolean(session?.user?.id && handle);

  const [invite, setInvite] = useState<PublicDmInvite | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentOk, setSentOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/dm-invites?id=${encodeURIComponent(inviteId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          invite?: PublicDmInvite;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.invite) {
          setLoadError(data.error || "見つかりません");
          setInvite(null);
        } else {
          setInvite(data.invite);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("ネットワークエラー");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inviteId]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-viscum-paper px-4 py-10 text-viscum-muted">
        読み込み中…
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-dvh bg-viscum-paper px-4 py-10 text-viscum-ink">
        <p className="text-[14px] text-viscum-muted">
          {loadError || "このお願いが見つかりませんでした。"}
        </p>
        <Link
          href="/dm/promo-15s"
          className="mt-4 inline-block text-viscum-brand underline"
        >
          デモの着地を見る
        </Link>
      </div>
    );
  }

  const { description, prompts } = splitSummary(invite.workSummary ?? "");
  const seederLabel = accountLabelForHandle(invite.fromHandle);
  const displayName =
    invite.fromAccountName?.trim() || seederLabel.line;
  const externalUrl = invite.workExternalUrl?.trim() || "";
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/dm/i/${invite.id}`)}`;
  const postedLine = invite.createdAt
    ? formatDateTime(new Date(invite.createdAt))
    : null;
  const deadlineLine = (() => {
    if (!invite.closesAt) return null;
    const closes = new Date(invite.closesAt);
    const ms = closes.getTime() - Date.now();
    if (ms <= 0) return `${formatDateTime(closes)}（終了）`;
    const days = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    const left =
      days > 0 ? `あと${days}日` : hours > 0 ? `あと${hours}時間` : "まもなく";
    return `${formatDateTime(closes)}（${left}）`;
  })();

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending || !canWrite) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await postWorkComment({
        workId: invite!.workId,
        subject: "直依頼への返事",
        body: text,
      });
      if (res.ok) {
        setBody("");
        setSentOk(true);
      } else {
        setSendError(res.error || "送れませんでした");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <header className="border-b border-viscum-line bg-viscum-leaf-deep px-4 py-3.5 text-white">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em]">
          <ViscumMark className="h-5 w-5" />
          VISCUM
        </p>
      </header>

      <main className="mx-auto max-w-lg pb-8">
        <div className="space-y-5 px-4 pt-5">
          <h1 className="text-xl font-semibold leading-snug text-viscum-ink">
            <span className="block">{displayName} から、</span>
            <span className="block">あなた宛てのお願いです</span>
          </h1>

          <div className="rounded-xl border-2 border-viscum-berry/50 bg-viscum-berry/10 px-4 py-3.5">
            <p className="text-[18px] font-semibold tabular-nums text-viscum-berry-deep">
              褒賞：{formatYen(invite.amountYen)}
            </p>
            <dl className="mt-2 space-y-1 text-[13px] text-viscum-ink">
              {postedLine ? (
                <div>
                  <dt className="inline text-viscum-muted">投稿：</dt>
                  <dd className="inline">{postedLine}</dd>
                </div>
              ) : null}
              {deadlineLine ? (
                <div>
                  <dt className="inline text-viscum-muted">締切：</dt>
                  <dd className="inline font-medium">{deadlineLine}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div>
            <p className="text-[12px] text-viscum-muted">作品</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug text-viscum-ink">
              {invite.workTitle}
            </h2>
          </div>

          <section className="space-y-2">
            <p className="text-[12px] text-viscum-muted">お願いの内容</p>
            {description ? (
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                {description}
              </p>
            ) : invite.pitch ? (
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                {invite.pitch}
              </p>
            ) : (
              <p className="text-[13px] text-viscum-muted">
                （本文スナップショットなし）
              </p>
            )}
            {prompts.length > 0 && (
              <div className="rounded-lg border border-viscum-line bg-white/50 px-3 py-3">
                <p className="text-[11px] font-medium text-viscum-muted">
                  聞きたいこと
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-viscum-ink">
                  {prompts.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {externalUrl ? (
            <div>
              <p className="mb-1.5 text-[12px] text-viscum-muted">
                お願いしたい作品
              </p>
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-md border border-viscum-brand px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
              >
                作品URLを開く
              </a>
            </div>
          ) : null}

          <SeederCredibilityLink handle={invite.fromHandle} />

          <section className="rounded-xl border border-viscum-brand/30 bg-white/70 px-4 py-4">
            <p className="text-[13px] font-medium text-viscum-ink">
              返事・コメントを書く
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
              作品を見たあとに、ここに書いて送ってください。ログインが必要です（無料）。相手の作品ページ／端末にも届きます。
            </p>

            {sentOk ? (
              <p className="mt-3 rounded-md border border-viscum-brand/30 bg-viscum-leaf-soft/40 px-3 py-2 text-[13px] text-viscum-ink">
                送りました。ありがとうございます。
              </p>
            ) : (
              <form onSubmit={sendReply} className="mt-3 space-y-3">
                <textarea
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setSendError(null);
                  }}
                  rows={5}
                  placeholder="見た感想・気づいた点・質問など"
                  className="w-full resize-y rounded-md border border-viscum-line bg-white px-3 py-2 text-[14px] text-viscum-ink placeholder:text-viscum-muted"
                />
                {sendError && (
                  <p className="text-[12px] text-viscum-berry-deep">{sendError}</p>
                )}
                {authStatus === "loading" ? (
                  <p className="text-[12px] text-viscum-muted">確認中…</p>
                ) : canWrite ? (
                  <button
                    type="submit"
                    disabled={sending || !body.trim()}
                    className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                  >
                    {sending ? "送信中…" : "返事を送る"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={loginHref}
                      className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
                    >
                      ログインして返事を送る
                    </Link>
                    <p className="text-[11px] leading-relaxed text-viscum-muted">
                      アカウント作成も同じ画面からできます。
                    </p>
                  </div>
                )}
              </form>
            )}
          </section>

          <section className="rounded-xl border border-viscum-line bg-viscum-paper-2/50 px-4 py-4">
            <p className="text-[13px] font-medium text-viscum-ink">
              VISCUMって何？
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-viscum-muted">
              シーダー（種を撒く人）が作品を出し、必要なときだけコメントをお願いする場。入場無料。稼ぐ副業アプリではなく、小さな広告費の出口です。
            </p>
            <Link
              href="/lp"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-[13px] font-medium text-viscum-brand underline"
            >
              LPでもう少し見る
            </Link>
          </section>

          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
