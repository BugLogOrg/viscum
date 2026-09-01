"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";
import { ViscumMark } from "@/components/ViscumMark";
import { SeederCredibilityLink } from "@/components/SeederCredibilityLink";
import { DirectRequestOfferCard } from "@/components/DirectRequestOfferCard";
import { accountLabelForHandle } from "@/data/suggested-seeders";

export type PublicDmInvite = {
  id: string;
  workId?: string;
  workTitle: string;
  workExternalUrl?: string;
  workThumbUrl?: string;
  workSummary?: string;
  teaserSummary?: string;
  amountYen: number;
  pitch?: string;
  fromHandle: string;
  fromAccountName?: string;
  createdAt?: string;
  closesAt?: string;
};

/**
 * Neon 招待スナップショット着地。local_* でも別端末で開ける。
 * 未ログインは teaser（タイトル・概要・金額）。詳細はログイン後。
 */
export function DmInviteFromNeon({ inviteId }: { inviteId: string }) {
  const { data: session, status: authStatus } = useSession();
  const handle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";
  const canWrite = Boolean(session?.user?.id && handle);
  const isLoggedIn = Boolean(session?.user?.id);

  const [invite, setInvite] = useState<PublicDmInvite | null>(null);
  const [reveal, setReveal] = useState<"teaser" | "full">("teaser");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentOk, setSentOk] = useState(false);
  const [threadPath, setThreadPath] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "loading") return;
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/dm-invites?id=${encodeURIComponent(inviteId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          invite?: PublicDmInvite;
          reveal?: "teaser" | "full";
          error?: string;
          revoked?: boolean;
        };
        if (cancelled) return;
        if (res.status === 410 || data.revoked) {
          setLoadError(
            data.error ||
              "この招待リンクは無効化されています。依頼主に新しい案内を聞いてください。",
          );
          setInvite(null);
          return;
        }
        if (!res.ok || !data.invite) {
          setLoadError(data.error || "見つかりません");
          setInvite(null);
        } else {
          setInvite(data.invite);
          setReveal(data.reveal === "full" ? "full" : "teaser");
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
  }, [inviteId, authStatus, isLoggedIn]);

  // 閲覧カウント（シーダー自身はAPI側で除外。同一タブの連打は sessionStorage で抑える）
  useEffect(() => {
    if (!invite?.id) return;
    const key = `viscum_invite_viewed:${invite.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    void fetch("/api/dm-invites/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId: invite.id }),
    }).catch(() => {
      /* ignore */
    });
  }, [invite?.id]);

  if (loading || authStatus === "loading") {
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

  const seederLabel = accountLabelForHandle(invite.fromHandle);
  const displayName =
    invite.fromAccountName?.trim() || seederLabel.line;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/dm/i/${invite.id}`)}`;
  const isOwnInvite =
    Boolean(handle) &&
    handle.toLowerCase() === invite.fromHandle.replace(/^@/, "").toLowerCase();
  const depth = reveal === "full" && isLoggedIn ? "full" : "teaser";

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending || !canWrite) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/dm-invites/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: invite!.id, message: text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        path?: string;
        error?: string;
        asSeeder?: boolean;
      };
      if (res.ok && data.ok) {
        setBody("");
        setSentOk(true);
        setThreadPath(data.path ?? "/dashboard/messages");
      } else {
        setSendError(data.error || "送れませんでした");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <header className="border-b border-viscum-line bg-viscum-leaf-deep px-4 py-3.5 text-white">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-white hover:opacity-90"
        >
          <ViscumMark className="h-5 w-5" />
          VISCUM
        </Link>
      </header>

      <main className="mx-auto max-w-lg pb-8">
        <DirectRequestOfferCard
          depth={depth}
          loginHref={depth === "teaser" ? loginHref : undefined}
          snapshot={{
            fromDisplayName: displayName,
            fromHandle: invite.fromHandle,
            workTitle: invite.workTitle,
            workExternalUrl: invite.workExternalUrl,
            workThumbUrl: invite.workThumbUrl,
            workSummary:
              depth === "teaser"
                ? invite.teaserSummary || invite.workSummary
                : invite.workSummary,
            pitch: invite.pitch,
            amountYen: invite.amountYen,
            createdAt: invite.createdAt,
            closesAt: invite.closesAt,
          }}
          afterBody={
            depth === "full" ? (
              <>
                <SeederCredibilityLink handle={invite.fromHandle} />

                <section className="rounded-xl border border-viscum-brand/30 bg-white/70 px-4 py-4">
                  <p className="text-[13px] font-medium text-viscum-ink">
                    {isOwnInvite
                      ? "このお願いのやりとり"
                      : "依頼主へ返事する"}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
                    {isOwnInvite ? (
                      <>
                        自分の招待着地です。ここに書いた内容は
                        <strong>ご依頼DM</strong>
                        に入ります（相手への返事待ちでも、あとから追記できます）。
                      </>
                    ) : (
                      <>
                        ここに書いた内容は、依頼主の<strong>ご依頼DM</strong>
                        に届きます（作品の公開コメント欄には残りません）。ログインが必要です（無料）。
                      </>
                    )}
                  </p>

                  {sentOk ? (
                    <div className="mt-3 space-y-2 rounded-md border border-viscum-brand/30 bg-viscum-leaf-soft/40 px-3 py-2 text-[13px] text-viscum-ink">
                      <p>
                        {isOwnInvite
                          ? "ご依頼DMに送りました。やりとりスレから続けられます。"
                          : "ご依頼DMに送りました。依頼主にも同じスレが見えます。"}
                      </p>
                      {threadPath ? (
                        <Link
                          href={threadPath}
                          className="inline-flex font-medium text-viscum-brand underline"
                        >
                          やりとりを開く
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <form onSubmit={sendReply} className="mt-3 space-y-3">
                      <textarea
                        value={body}
                        onChange={(e) => {
                          setBody(e.target.value);
                          setSendError(null);
                        }}
                        rows={5}
                        placeholder={
                          isOwnInvite
                            ? "相手への追記・確認・メモなど"
                            : "見た感想・気づいた点・質問など"
                        }
                        className="w-full resize-y rounded-md border border-viscum-line bg-white px-3 py-2 text-[14px] text-viscum-ink placeholder:text-viscum-muted"
                      />
                      {sendError && (
                        <p className="text-[12px] text-viscum-berry-deep">
                          {sendError}
                        </p>
                      )}
                      {canWrite ? (
                        <button
                          type="submit"
                          disabled={sending || !body.trim()}
                          className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                        >
                          {sending ? "送信中…" : "ご依頼DMに送る"}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <Link
                            href={loginHref}
                            className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
                          >
                            ログインして返事を送る
                          </Link>
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
                    個人の作品に、必要なときだけ反応をお願いする場です。見るだけ無料。返事する側に課金はありません。
                  </p>
                  <Link
                    href="/lp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-[13px] font-medium text-viscum-brand underline"
                  >
                    LPでもう少し見る
                  </Link>
                  <Link
                    href="/faq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-[13px] font-medium text-viscum-brand underline"
                  >
                    届く→返す→払うの流れ（FAQ）
                  </Link>
                </section>

                <SiteFooter />
              </>
            ) : (
              <div className="space-y-4 pb-8">
                <SeederCredibilityLink handle={invite.fromHandle} />
                <p className="text-[12px] leading-relaxed text-viscum-muted">
                  依頼主が誰か・ちゃんと払ってきたかは、上のプロフィールから確認できます（直依頼の中身は公開されません）。
                </p>
                <SiteFooter />
              </div>
            )
          }
        />
      </main>
    </div>
  );
}
