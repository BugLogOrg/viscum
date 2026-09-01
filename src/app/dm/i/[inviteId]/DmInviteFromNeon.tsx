"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  requestId?: string;
  requestStatus?: string;
};

/**
 * Neon 招待スナップショット着地。local_* でも別端末で開ける。
 * 未ログイン teaser: やる＝ログイン後確定／辞退＝ログイン不要でお礼＋閉じる＋依頼主通知。
 */
export function DmInviteFromNeon({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const handle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";
  const canWrite = Boolean(session?.user?.id && handle);
  const isLoggedIn = Boolean(session?.user?.id);
  const intentRaw = searchParams.get("intent")?.trim().toLowerCase() ?? "";
  const intent = intentRaw === "accept" ? "accept" : null;
  const intentRan = useRef(false);

  const [invite, setInvite] = useState<PublicDmInvite | null>(null);
  const [reveal, setReveal] = useState<"teaser" | "full">("teaser");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [intentNote, setIntentNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentOk, setSentOk] = useState(false);
  const [threadPath, setThreadPath] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [declinedOk, setDeclinedOk] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

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
          declined?: boolean;
        };
        if (cancelled) return;
        if (res.status === 410 || data.revoked) {
          if (data.declined) {
            setDeclinedOk(true);
            setLoadError(null);
            setInvite(null);
            return;
          }
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

  // teaser で選んだ「やる」を、ログイン＋英語ID後に確定
  useEffect(() => {
    if (!intent || !canWrite || !invite?.id) return;
    const own =
      Boolean(handle) &&
      handle.toLowerCase() ===
        invite.fromHandle.replace(/^@/, "").toLowerCase();
    if (own) return;
    if (intentRan.current) return;
    intentRan.current = true;
    setIntentNote("引き受けを確定しています…");
    void fetch("/api/dm-invites/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteId: invite.id,
        status: "accepted",
      }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          path?: string;
          error?: string;
        };
        if (res.ok && data.ok && data.path) {
          router.replace(data.path);
          return;
        }
        setIntentNote(data.error || "引き受けを確定できませんでした");
        intentRan.current = false;
      })
      .catch(() => {
        setIntentNote("ネットワークエラー");
        intentRan.current = false;
      });
  }, [intent, canWrite, invite?.id, invite?.fromHandle, handle, router]);

  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-dvh bg-viscum-paper px-4 py-10 text-viscum-muted">
        読み込み中…
      </div>
    );
  }

  if (declinedOk) {
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
        <main className="mx-auto max-w-lg px-4 py-10">
          <h1 className="text-[17px] font-semibold text-viscum-ink">
            お礼を伝えて閉じました
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-viscum-muted">
            依頼主に「いまは無理」と通知しました。この案内リンクはもう使えません。アカウント登録は不要です。このタブは閉じて大丈夫です。
          </p>
          <Link
            href="/lp"
            className="mt-6 inline-block text-[13px] text-viscum-brand underline"
          >
            VISCUMについて見る
          </Link>
        </main>
        <SiteFooter />
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
  const acceptHref = isLoggedIn
    ? `/dm/i/${invite.id}?intent=accept`
    : `/login?callbackUrl=${encodeURIComponent(`/dm/i/${invite.id}?intent=accept`)}`;
  const isOwnInvite =
    Boolean(handle) &&
    handle.toLowerCase() === invite.fromHandle.replace(/^@/, "").toLowerCase();
  const depth = reveal === "full" && isLoggedIn ? "full" : "teaser";
  const requestPending =
    !invite.requestStatus || invite.requestStatus === "pending";
  const showDecide =
    !isOwnInvite && requestPending && !declinedOk && !sentOk;

  async function declineWithoutLogin() {
    if (declining || isOwnInvite || !invite) return;
    const targetId = invite.id;
    const ok = window.confirm(
      "このお願いを辞退しますか？\nお礼を伝えて案内を閉じ、依頼主に通知します。ログインは不要です。",
    );
    if (!ok) return;
    setDeclining(true);
    setDeclineError(null);
    try {
      const res = await fetch("/api/dm-invites/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: targetId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok && data.ok) {
        setDeclinedOk(true);
        return;
      }
      setDeclineError(data.error || "辞退できませんでした");
    } catch {
      setDeclineError("ネットワークエラー");
    } finally {
      setDeclining(false);
    }
  }

  async function acceptWhenReady() {
    if (accepting || isOwnInvite || !invite) return;
    if (!canWrite) {
      router.push(acceptHref);
      return;
    }
    setAccepting(true);
    setIntentNote("引き受けを確定しています…");
    try {
      const res = await fetch("/api/dm-invites/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteId: invite.id,
          status: "accepted",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        path?: string;
        error?: string;
      };
      if (res.ok && data.ok && data.path) {
        router.replace(data.path);
        return;
      }
      setIntentNote(data.error || "引き受けを確定できませんでした");
    } catch {
      setIntentNote("ネットワークエラー");
    } finally {
      setAccepting(false);
    }
  }

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
        {intentNote ? (
          <p className="border-b border-viscum-line px-4 py-3 text-[13px] text-viscum-muted">
            {intentNote}
          </p>
        ) : null}
        {declineError ? (
          <p className="border-b border-viscum-line px-4 py-3 text-[13px] text-viscum-berry-deep">
            {declineError}
          </p>
        ) : null}
        <DirectRequestOfferCard
          depth={depth}
          loginHref={depth === "teaser" ? loginHref : undefined}
          loginAcceptHref={
            depth === "teaser" && !isOwnInvite ? acceptHref : undefined
          }
          onDecline={
            depth === "teaser" && !isOwnInvite
              ? () => void declineWithoutLogin()
              : undefined
          }
          declining={declining}
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

                {showDecide ? (
                  <section className="space-y-2 rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
                    <p className="text-[13px] font-medium text-viscum-ink">
                      このお願いへの返事
                    </p>
                    <p className="text-[12px] leading-relaxed text-viscum-muted">
                      「いまは無理」はログイン不要です。お礼を伝えて案内を閉じ、依頼主に通知します。
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={accepting || declining}
                        onClick={() => void acceptWhenReady()}
                        className="flex flex-1 items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-[14px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                      >
                        {accepting ? "確定中…" : "やる"}
                      </button>
                      <button
                        type="button"
                        disabled={accepting || declining}
                        onClick={() => void declineWithoutLogin()}
                        className="flex flex-1 items-center justify-center rounded-md border border-viscum-berry/45 bg-viscum-berry/5 px-3 py-2.5 text-[14px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10 disabled:opacity-50"
                      >
                        {declining ? "閉じています…" : "いまは無理（辞退）"}
                      </button>
                    </div>
                  </section>
                ) : null}

                <section className="rounded-xl border border-viscum-brand/30 bg-white/70 px-4 py-4">
                  <p className="text-[13px] font-medium text-viscum-ink">
                    {isOwnInvite
                      ? "このお願いのやりとり"
                      : "依頼主へメッセージを送る"}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
                    {isOwnInvite ? (
                      <>
                        自分の招待着地です。ここに書いた内容は
                        <strong>ご依頼DM</strong>
                        に入ります（相手への返事待ちでも、あとから追記できます）。
                      </>
                    ) : canWrite ? (
                      <>
                        ここに書いた内容は、依頼主の<strong>ご依頼DM</strong>
                        に届きます（作品の公開コメント欄には残りません）。
                      </>
                    ) : (
                      <>
                        ここに書いた内容は、依頼主の<strong>ご依頼DM</strong>
                        に届きます（作品の公開コメント欄には残りません）。英語IDの設定が必要です（無料）。
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
