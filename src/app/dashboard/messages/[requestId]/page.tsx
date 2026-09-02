"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { DirectRequestOfferCard } from "@/components/DirectRequestOfferCard";
import { SeederCredibilityLink } from "@/components/SeederCredibilityLink";
import {
  clearLocalRequestDms,
  estimateSeederPaysYen,
  formatRequestAmountLabel,
  formatRequestDmStamp,
  isDeliverableStatusNote,
  isLegacyLocalRequestId,
  isRequestDeadlinePassed,
  type RequestDm,
} from "@/lib/local-request-dms";
import { RequestDeliverableStatus } from "@/components/RequestDeliverableStatus";
import { displayAccountName, readLocalProfile } from "@/lib/local-profile";
import {
  displayRequestWorkTitle,
  isDemoSeed,
  resolveWorkClient,
} from "@/lib/local-seeds";
import { splitRequestSummary } from "@/lib/direct-request-offer";
import {
  buildOutboundInviteShareText,
  shareDeadlineLabelFromClosesAt,
  writeCachedOutboundInvite,
  INVITE_VIEW_WARN_THRESHOLD,
} from "@/lib/outbound-invite-share";
import { fetchRequestDm, patchRequestDm } from "@/lib/remote-requests";

export default function RequestDmThreadPage() {
  const params = useParams();
  const requestId = decodeURIComponent(String(params.requestId ?? ""));
  const { data: session, status } = useSession();
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  const [row, setRow] = useState<RequestDm | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const [inviteThumb, setInviteThumb] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [payNote, setPayNote] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [inviteViewCount, setInviteViewCount] = useState<number | null>(null);
  const [reissueBusy, setReissueBusy] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);

  useEffect(() => {
    clearLocalRequestDms();
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // シーダー: 招待閲覧数＋httpsサムネ補完（lean。data URL は引かない）
  useEffect(() => {
    if (!row?.inviteId || !handle) {
      setInviteViewCount(null);
      setInviteThumb(null);
      return;
    }
    const isOwner =
      row.fromHandle.replace(/^@/, "").toLowerCase() === handle.toLowerCase();
    const needThumb = !row.workThumbUrl?.trim();
    if (!isOwner && !needThumb) {
      setInviteViewCount(null);
      setInviteThumb(null);
      return;
    }
    let cancelled = false;
    const pull = () => {
      void fetch(
        `/api/dm-invites?id=${encodeURIComponent(row.inviteId!)}&lean=1`,
        { cache: "no-store" },
      )
        .then(async (res) => {
          const data = (await res.json().catch(() => ({}))) as {
            invite?: { viewCount?: number; workThumbUrl?: string };
          };
          if (cancelled) return;
          if (isOwner && typeof data.invite?.viewCount === "number") {
            setInviteViewCount(data.invite.viewCount);
          }
          if (needThumb) {
            const t = data.invite?.workThumbUrl?.trim();
            setInviteThumb(t && /^https?:\/\//i.test(t) ? t : null);
          }
        })
        .catch(() => {
          /* ignore */
        });
    };
    pull();
    const t = isOwner ? window.setInterval(pull, 30_000) : 0;
    return () => {
      cancelled = true;
      if (t) window.clearInterval(t);
    };
  }, [row?.inviteId, row?.fromHandle, row?.workThumbUrl, handle]);

  useEffect(() => {
    if (isLegacyLocalRequestId(requestId)) {
      setRow(null);
      setError(
        "これは移行前の端末内データです。相手には届いていません。直依頼画面から送り直してください。",
      );
      setLoading(false);
      return;
    }
    // セッション待ちの前に取りに行く（クッキーあれば通る）。handle 待ちだと読み込みが二重になる
    let cancelled = false;
    setLoading(true);
    void fetchRequestDm(requestId).then((res) => {
      if (cancelled) return;
      if (res.request) {
        setRow(res.request);
        setError(null);
      } else {
        setRow(null);
        setError(res.error || "見つかりません");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  useEffect(() => {
    if (typeof window === "undefined" || !handle) return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const paymentId = params.get("payment");
    if (checkout !== "success" && checkout !== "cancel") return;

    let cancelled = false;
    void (async () => {
      if (checkout === "success" && paymentId) {
        setPayNote("決済を確認しています…");
        try {
          await fetch("/api/checkout/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        } catch {
          /* refresh anyway */
        }
        if (cancelled) return;
        const res = await fetchRequestDm(requestId);
        if (cancelled) return;
        if (res.request) setRow(res.request);
        setPayNote(
          res.request?.status === "paid"
            ? "お支払いが完了しました（支払済）。"
            : "決済の反映を確認中です。数秒後に再読み込みしてください。",
        );
      } else if (checkout === "cancel") {
        setPayNote("決済をキャンセルしました。支払待ちのままです。");
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.pathname + url.search);
    })();

    return () => {
      cancelled = true;
    };
  }, [handle, requestId]);

  // 初回だけフル画面の読み込み。再取得や session 再評価でシェルを潰さない
  if ((status === "loading" || loading) && !row) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard/messages" hideOnMd hidePostCta />
        <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      </BrowseChrome>
    );
  }

  if (status === "unauthenticated" || (!session?.user && status !== "loading")) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10">
          <p className="text-[14px] text-viscum-muted">ログインが必要です。</p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/dashboard/messages/${requestId}`)}`}
            className="mt-6 inline-flex rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white"
          >
            ログインへ
          </Link>
        </main>
      </BrowseChrome>
    );
  }

  if (!handle) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard/messages" hideOnMd hidePostCta />
        <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          英語IDの設定が必要です…
        </div>
      </BrowseChrome>
    );
  }

  if (!row) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard/messages" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10">
          <p className="text-[14px] text-viscum-muted">
            {error || "このご依頼は見つかりません。"}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-[13px]">
            <Link
              href="/dashboard/messages"
              className="text-viscum-brand underline"
            >
              一覧へ
            </Link>
            <Link href="/new" className="text-viscum-brand underline">
              シードして直依頼から送り直す
            </Link>
          </div>
        </main>
      </BrowseChrome>
    );
  }

  const me = handle.toLowerCase();
  const isRecipient = row.toHandle.toLowerCase() === me;
  const isParty =
    isRecipient || row.fromHandle.toLowerCase() === me;
  if (!isParty) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard/messages" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10">
          <p className="text-[14px] text-viscum-muted">
            このご依頼の当事者ではありません。
          </p>
        </main>
      </BrowseChrome>
    );
  }

  const peerHandle = isRecipient
    ? row.fromHandle
    : row.outboundUnassigned
      ? ""
      : row.toHandle;
  const peerLabel = isRecipient
    ? row.fromAccountName || row.fromHandle
    : row.outboundUnassigned
      ? "外リンク（返事待ち）"
      : row.toHandle;

  /** pitch は作成時に messages[0] にも入るので、スレでは重複表示しない */
  const pitchText = row.pitch?.trim() ?? "";
  const threadMessages = (() => {
    if (!pitchText || row.messages.length === 0) return row.messages;
    const [first, ...rest] = row.messages;
    if (
      first.fromHandle.toLowerCase() === row.fromHandle.toLowerCase() &&
      first.body.trim() === pitchText
    ) {
      return rest;
    }
    return row.messages;
  })();

  const workTitle = displayRequestWorkTitle(row.workId, row.workTitle);
  const liveWork = resolveWorkClient(row.workId);
  const liveBody = (() => {
    if (!liveWork) return "";
    const desc = liveWork.description?.trim() ?? "";
    const focus = (liveWork.prompts ?? [])
      .map((s) => s.trim())
      .filter(Boolean);
    if (focus.length) return `${desc}\n\n【聞きたいこと】\n${focus.join("\n")}`.trim();
    return desc;
  })();
  const seedBody = row.workSummary?.trim() || liveBody;
  const thumbUrl =
    row.workThumbUrl?.trim() ||
    inviteThumb?.trim() ||
    liveWork?.thumbUrl?.trim() ||
    "";
  const fromDisplay =
    row.fromAccountName?.trim() ||
    displayAccountName(row.fromHandle, readLocalProfile(row.fromHandle));
  const isSeeder = row.fromHandle.toLowerCase() === me;
  const threadEnded =
    row.status === "closed" ||
    row.status === "declined" ||
    row.status === "paid";
  const inviteHref = row.inviteId
    ? `/dm/i/${encodeURIComponent(row.inviteId)}`
    : null;
  /** 打ち切り・支払済・辞退後は案内文／再発行を出さない */
  const inviteShareOpen =
    row.status === "pending" ||
    row.status === "accepted" ||
    row.status === "pay_waiting";
  const amountYen = row.amountYen;
  const workExternalUrl =
    row.workExternalUrl?.trim() || liveWork?.externalUrl?.trim() || "";

  async function refresh() {
    const res = await fetchRequestDm(requestId);
    if (res.request) setRow(res.request);
  }

  async function copyOutboundAgain() {
    if (!inviteHref || !origin || !row || !inviteShareOpen) return;
    const { prompts } = splitRequestSummary(seedBody);
    const pitch = pitchText;
    const askBullets =
      prompts.length > 0
        ? prompts
        : pitch
          ? [pitch]
          : ["初見の感想を短くいただけると助かります。"];
    const text = buildOutboundInviteShareText({
      fromLabel: fromDisplay,
      workTitle,
      workUrl: workExternalUrl || undefined,
      askBullets,
      pitchTrim: pitch || undefined,
      amountLabel: formatRequestAmountLabel(amountYen),
      deadlineLabel:
        shareDeadlineLabelFromClosesAt(row.closesAt) ?? undefined,
      inviteUrl: `${origin}${inviteHref}`,
    });
    try {
      await navigator.clipboard?.writeText(text);
      setCopyNote("案内文をコピーしました（着地と同じ内容へのリンク付き）");
    } catch {
      setCopyNote("コピーに失敗しました");
    }
  }

  async function reissueInviteFromThread() {
    if (!row?.inviteId || !handle || reissueBusy || !inviteShareOpen) return;
    const ok = window.confirm(
      "いまの招待リンクを無効化して、新しいURLを発行します。\n既に送った案内のリンクは開けなくなります。よろしいですか？",
    );
    if (!ok) return;
    setReissueBusy(true);
    setCopyNote(null);
    try {
      const res = await fetch("/api/dm-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replaceInviteId: row.inviteId,
          workId: row.workId,
          workTitle: row.workTitle,
          workExternalUrl: row.workExternalUrl || undefined,
          workThumbUrl: row.workThumbUrl || undefined,
          workSummary: row.workSummary || undefined,
          amountYen: row.amountYen,
          pitch: row.pitch || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        invite?: { id: string; path: string; viewCount?: number };
        request?: { id: string; path: string };
        error?: string;
      };
      if (!res.ok || !data.invite?.path) {
        setCopyNote(data.error || "再発行に失敗しました");
        return;
      }
      writeCachedOutboundInvite(handle, {
        invitePath: data.invite.path,
        requestPath: data.request?.path ?? `/dashboard/messages/${requestId}`,
        amountYen: row.amountYen,
        workId: row.workId,
        updatedAt: new Date().toISOString(),
      });
      setInviteViewCount(
        typeof data.invite.viewCount === "number" ? data.invite.viewCount : 0,
      );
      await refresh();
      setCopyNote(
        "旧リンクを無効化し、新しいURLを発行しました。案内文を再コピーして相手に送ってください。",
      );
    } catch {
      setCopyNote("ネットワークエラー");
    } finally {
      setReissueBusy(false);
    }
  }

  async function respond(next: "accepted" | "declined") {
    if (responding || !row) return;
    setResponding(true);
    const prev = row;
    const note =
      next === "accepted" ? "やる、と返しました。" : "いまは無理、と返しました。";
    setRow({
      ...row,
      status: next,
      messages: [
        ...row.messages,
        {
          id: `local_${Date.now()}`,
          fromHandle: handle!,
          body: note,
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    });
    try {
      const res = await patchRequestDm(requestId, { status: next });
      if (res.request) setRow(res.request);
      else if (!res.ok) {
        setRow(prev);
        setConfirmDecline(false);
      } else {
        setConfirmDecline(false);
      }
    } catch {
      setRow(prev);
      setConfirmDecline(false);
    } finally {
      setResponding(false);
    }
  }

  async function runStatus(
    next: "pay_waiting" | "paid" | "closed",
    extendDays?: number,
  ) {
    if (responding) return;
    if (next === "pay_waiting") {
      const ok = window.confirm(
        "成果を提出しますか？\n依頼主に提出済みとして届き、完了承認・お支払い待ちになります。",
      );
      if (!ok) return;
    }
    if (next === "closed") {
      const ok = window.confirm(
        "このお願いを打ち切りますか？\n案内リンクは無効になり、このスレにはもう書けなくなります。\n続ける場合は、新しい直依頼を作って別の案内を送ってください。",
      );
      if (!ok) return;
    }
    setResponding(true);
    setPayNote(null);
    try {
      const res = await patchRequestDm(requestId, {
        status: next,
        ...(extendDays ? { extendDays } : {}),
      });
      if (res.request) setRow(res.request);
      else await refresh();
      if (!res.ok && res.error) setPayNote(res.error);
    } finally {
      setResponding(false);
    }
  }

  async function startDirectRequestCheckout() {
    if (responding || !row) return;
    setResponding(true);
    setPayNote(null);
    try {
      const res = await fetch("/api/checkout/direct-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setPayNote(data.error || `決済を開始できません（${res.status}）`);
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayNote("ネットワークエラー");
    } finally {
      setResponding(false);
    }
  }

  async function extendDeadline(days: number) {
    if (responding) return;
    setResponding(true);
    try {
      const res = await patchRequestDm(requestId, { extendDays: days });
      if (res.request) setRow(res.request);
      else await refresh();
    } finally {
      setResponding(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !row || !handle) return;
    setSending(true);
    const optimisticId = `local_${Date.now().toString(36)}`;
    const optimistic = {
      id: optimisticId,
      fromHandle: handle,
      body: text,
      createdAt: new Date().toISOString(),
    };
    setRow({
      ...row,
      messages: [...row.messages, optimistic],
    });
    setDraft("");
    try {
      const res = await patchRequestDm(requestId, { message: text });
      if (res.request) {
        setRow((prev) =>
          prev
            ? {
                ...res.request!,
                workThumbUrl: prev.workThumbUrl || res.request!.workThumbUrl,
                workSummary: res.request!.workSummary || prev.workSummary,
              }
            : res.request!,
        );
      } else {
        await refresh();
        setDraft(text);
        setRow((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.filter((m) => m.id !== optimisticId),
              }
            : prev,
        );
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <BrowseChrome>
      <SiteHeader backHref="/dashboard/messages" hideOnMd hidePostCta />
      <main className="mx-auto flex max-w-lg flex-col pb-8">
        <div className="space-y-1 border-b border-viscum-line px-4 pb-4 pt-4">
          <p className="text-[12px] text-viscum-muted">ご依頼DM</p>
          <h1 className="text-lg font-semibold text-viscum-ink">
            {peerLabel}
            {peerHandle ? (
              <span className="ml-1 text-[13px] font-normal text-viscum-muted">
                @{peerHandle}
              </span>
            ) : null}
          </h1>
          <p className="text-[12px] text-viscum-muted">
            {isSeeder && inviteHref && inviteShareOpen ? (
              <>
                <Link
                  href={inviteHref}
                  className="font-medium text-viscum-brand underline"
                >
                  相手に渡す案内ページ
                </Link>
              </>
            ) : (
              "ご依頼ごとのやりとり"
            )}
          </p>
          {isSeeder && row.outboundUnassigned && inviteShareOpen ? (
            <p className="mt-2 rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2 text-[12px] leading-relaxed text-viscum-muted">
              相手はまだ返事待ちです。LINEやメールに貼るのは「案内ページ」のリンク（案内文の末尾）です。下のカードはその案内の中身の控えで、下書きではありません。このタブは返事が来たあとに使うやりとり画面です。
            </p>
          ) : null}
          {isSeeder && inviteHref && inviteShareOpen ? (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void copyOutboundAgain();
                  }}
                  className="rounded-md bg-viscum-berry px-3 py-1.5 text-[12px] font-medium text-white"
                >
                  案内文を再コピー
                </button>
                <button
                  type="button"
                  disabled={reissueBusy}
                  onClick={() => {
                    void reissueInviteFromThread();
                  }}
                  className="rounded-md border border-viscum-berry/40 px-3 py-1.5 text-[12px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10 disabled:opacity-50"
                >
                  {reissueBusy ? "再発行中…" : "リンクを無効化して再発行"}
                </button>
              </div>
              {inviteViewCount != null ? (
                <p
                  className={`text-[12px] leading-relaxed ${
                    inviteViewCount >= INVITE_VIEW_WARN_THRESHOLD
                      ? "text-viscum-berry-deep"
                      : "text-viscum-muted"
                  }`}
                >
                  案内ページの閲覧: {inviteViewCount}回
                  {inviteViewCount >= INVITE_VIEW_WARN_THRESHOLD
                    ? "（多めです。転送されたかも。無効化して再発行できます）"
                    : "（自分のプレビューは数えません）"}
                </p>
              ) : null}
            </div>
          ) : null}
          {copyNote ? (
            <p className="mt-1 text-[12px] text-viscum-brand">{copyNote}</p>
          ) : null}
        </div>

        <DirectRequestOfferCard
          snapshot={{
            fromDisplayName: fromDisplay,
            fromHandle: row.fromHandle,
            workTitle,
            workExternalUrl: workExternalUrl || undefined,
            workThumbUrl: thumbUrl || undefined,
            workSummary: seedBody || undefined,
            pitch: pitchText || undefined,
            amountYen: row.amountYen,
            createdAt: row.createdAt,
            closesAt: row.closesAt,
          }}
          headline={
            isSeeder ? (
              <>
                <span className="block">ご依頼内容</span>
                <span className="mt-1 block text-[12px] font-normal text-viscum-muted">
                  相手に渡す案内の中身です（下書きではありません）。
                  {inviteHref ? (
                    <>
                      {" "}
                      相手へ送るリンクは{" "}
                      <Link
                        href={inviteHref}
                        className="font-medium text-viscum-brand underline"
                      >
                        こちら（案内ページ）
                      </Link>
                      。いまの画面は、返事が来たあとのやりとりです。
                    </>
                  ) : (
                    " いまの画面は、返事が来たあとのやりとりです。"
                  )}
                </span>
              </>
            ) : (
              <>
                <span className="block">ご依頼内容</span>
                <span className="mt-1 block text-[12px] font-normal text-viscum-muted">
                  依頼主から届いたお願いです
                </span>
              </>
            )
          }
          showFeeNote={!isSeeder}
          afterBody={
            <>
              {isRecipient ? (
                <SeederCredibilityLink handle={row.fromHandle} />
              ) : null}
              {isDemoSeed(row.workId) ? (
                <p className="rounded-md border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-2 text-[12px] leading-relaxed text-viscum-ink">
                  このご依頼は<strong>見本作品</strong>（{row.workId}
                  ）に紐づいています。さっきシードした作品ではありません。完了画面の「サイト内のメンターに頼む」から送り直すと、自分の作品名で残ります。
                </p>
              ) : null}
            </>
          }
        />

        <div className="px-4">
        <ul className="mt-5 space-y-3">
          {threadMessages.map((m) => {
            const mine = m.fromHandle.toLowerCase() === me;
            const statusNote = isDeliverableStatusNote(m.body, m.fromHandle);
            const name = statusNote
              ? "ステータス"
              : mine
                ? displayAccountName(handle, readLocalProfile(handle))
                : m.fromHandle === row.fromHandle
                  ? row.fromAccountName || m.fromHandle
                  : m.fromHandle;
            return (
              <li
                key={m.id}
                className={`rounded-lg border px-3 py-2.5 text-[14px] leading-relaxed ${
                  statusNote
                    ? "border-dashed border-viscum-line bg-viscum-paper-2/50 text-[13px]"
                    : mine
                      ? "ml-6 border-viscum-brand/25 bg-viscum-leaf-soft/40"
                      : "mr-6 border-viscum-line bg-white/60"
                }`}
              >
                <p className="text-[11px] text-viscum-muted">
                  {name}
                  {statusNote ? null : (
                    <>
                      {" "}
                      · @{m.fromHandle}
                    </>
                  )}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-viscum-ink">
                  {m.body}
                </p>
                {m.createdAt ? (
                  <p className="mt-1.5 text-right text-[10px] tabular-nums text-viscum-muted">
                    <time dateTime={m.createdAt}>
                      {formatRequestDmStamp(m.createdAt)}
                    </time>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* いまの状態は会話のあと（一番下側）で確認する */}
        <RequestDeliverableStatus status={row.status} className="mt-5" />

        {isRequestDeadlinePassed(row.closesAt) &&
        row.status !== "paid" &&
        row.status !== "declined" &&
        row.status !== "closed" ? (
          <p className="mt-4 rounded-md border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-2 text-[12px] leading-relaxed text-viscum-ink">
            希望日を過ぎています（即失効ではありません）。依頼主は延長するか、打ち切れます。
          </p>
        ) : null}

        {isRecipient && row.status === "pending" && (
          <div className="mt-4 space-y-2 rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
            <p className="text-[13px] font-medium text-viscum-ink">
              このお願いへの返事
            </p>
            {!confirmDecline ? (
              <>
                <p className="text-[12px] leading-relaxed text-viscum-muted">
                  「いまは無理」で辞退するとスレは閉じ、案内リンクも無効になります。
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() => void respond("accepted")}
                    className="flex-1 rounded-md bg-viscum-berry px-3 py-2.5 text-[14px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                  >
                    {responding ? "送信中…" : "やる"}
                  </button>
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() => setConfirmDecline(true)}
                    className="flex-1 rounded-md border border-viscum-berry/45 bg-viscum-berry/5 px-3 py-2.5 text-[14px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10 disabled:opacity-50"
                  >
                    いまは無理（辞退）
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[12px] leading-relaxed text-viscum-muted">
                  辞退するとスレは閉じ、案内リンクも無効になります。あとからこのスレには書けません。
                </p>
                <button
                  type="button"
                  disabled={responding}
                  onClick={() => void respond("declined")}
                  className="w-full rounded-md bg-viscum-berry px-3 py-2.5 text-[14px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                >
                  {responding ? "反映しています…" : "辞退して案内を終了"}
                </button>
                <button
                  type="button"
                  disabled={responding}
                  onClick={() => setConfirmDecline(false)}
                  className="w-full text-center text-[12px] text-viscum-muted underline underline-offset-2 hover:text-viscum-ink disabled:opacity-50"
                >
                  辞退しない（やる／辞退の選択に戻る）
                </button>
              </>
            )}
          </div>
        )}

        {isRecipient && row.status === "accepted" ? (
          <div className="mt-4 space-y-2">
            <p className="text-[12px] text-viscum-muted">
              書き終えたら提出してください。依頼主の完了承認で支払待ちになります（督促ではありません）。
            </p>
            <button
              type="button"
              disabled={responding}
              onClick={() => void runStatus("pay_waiting")}
              className="w-full rounded-md bg-viscum-berry px-3 py-2.5 text-[14px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
            >
              {responding ? "送信中…" : "提出する"}
            </button>
          </div>
        ) : null}

        {isRecipient && row.status === "pay_waiting" ? (
          <p className="mt-4 rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2 text-[12px] text-viscum-muted">
            提出済みです。依頼主の完了承認・お支払いを待っています。
          </p>
        ) : null}

        {isSeeder && row.status === "pay_waiting" ? (
          <div className="mt-4 space-y-2">
            {row.amountYen > 0 ? (
              <>
                <p className="text-[12px] text-viscum-muted">
                  メンターが提出しました。内容を確認し、Stripe
                  Checkoutで完了払いします。褒賞{" "}
                  {formatRequestAmountLabel(row.amountYen)}
                  ／支払い目安 約{" "}
                  {formatRequestAmountLabel(
                    estimateSeederPaysYen(row.amountYen).seederPaysYen,
                  )}
                  （約10%・決済込み）。
                </p>
                <button
                  type="button"
                  disabled={responding}
                  onClick={() => void startDirectRequestCheckout()}
                  className="w-full rounded-md bg-viscum-berry px-3 py-2.5 text-[14px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                >
                  {responding
                    ? "準備中…"
                    : `完了を承認して支払う（約 ${formatRequestAmountLabel(estimateSeederPaysYen(row.amountYen).seederPaysYen)}）`}
                </button>
              </>
            ) : (
              <>
                <p className="text-[12px] text-viscum-muted">
                  メンターが提出しました。無料のためカード決済は不要です。
                </p>
                <button
                  type="button"
                  disabled={responding}
                  onClick={() => void runStatus("paid")}
                  className="w-full rounded-md bg-viscum-berry px-3 py-2.5 text-[14px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                >
                  {responding ? "送信中…" : "完了を承認（無料・支払済にする）"}
                </button>
              </>
            )}
            {payNote ? (
              <p className="text-[12px] text-viscum-muted">{payNote}</p>
            ) : null}
          </div>
        ) : null}

        {payNote && !(isSeeder && row.status === "pay_waiting") ? (
          <p className="mt-3 text-[12px] text-viscum-muted">{payNote}</p>
        ) : null}

        {isSeeder &&
        (row.status === "pending" || row.status === "accepted") ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={responding}
                onClick={() => void extendDeadline(7)}
                className="rounded-md border border-viscum-line px-3 py-1.5 text-[12px] font-medium text-viscum-ink disabled:opacity-50"
              >
                希望日を7日延ばす
              </button>
              <button
                type="button"
                disabled={responding}
                onClick={() => void extendDeadline(14)}
                className="rounded-md border border-viscum-line px-3 py-1.5 text-[12px] font-medium text-viscum-ink disabled:opacity-50"
              >
                希望日を14日延ばす
              </button>
            </div>
            <div className="rounded-lg border border-viscum-berry/35 bg-viscum-berry/5 px-3 py-3">
              <p className="text-[13px] font-medium text-viscum-berry-deep">
                このお願いを終わらせる
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
                打ち切ると案内リンクは無効になり、このスレには書けなくなります。続けるときは新しい直依頼を作って別の案内を送ってください。
              </p>
              <button
                type="button"
                disabled={responding}
                onClick={() => void runStatus("closed")}
                className="mt-2 w-full rounded-md border border-viscum-berry/50 bg-white px-3 py-2.5 text-[14px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10 disabled:opacity-50"
              >
                打ち切る
              </button>
            </div>
          </div>
        ) : null}

        {isSeeder && row.status === "pay_waiting" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={responding}
              onClick={() => void extendDeadline(7)}
              className="rounded-md border border-viscum-line px-3 py-1.5 text-[12px] font-medium text-viscum-ink disabled:opacity-50"
            >
              希望日を7日延ばす
            </button>
            <button
              type="button"
              disabled={responding}
              onClick={() => void extendDeadline(14)}
              className="rounded-md border border-viscum-line px-3 py-1.5 text-[12px] font-medium text-viscum-ink disabled:opacity-50"
            >
              希望日を14日延ばす
            </button>
          </div>
        ) : null}

        {row.status === "paid" ? (
          <p className="mt-4 rounded-md border border-viscum-brand/30 bg-viscum-leaf-soft/40 px-3 py-2 text-[12px] text-viscum-ink">
            支払済です。このスレへの追記はできません。
          </p>
        ) : null}
        {row.status === "closed" ? (
          <p className="mt-4 rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2 text-[12px] leading-relaxed text-viscum-muted">
            {isSeeder ? (
              <>
                打ち切りました。案内リンクは無効です。続ける場合は
                <Link
                  href="/new/request"
                  className="text-viscum-brand underline"
                >
                  新しい直依頼
                </Link>
                を作って別の案内を送ってください。
              </>
            ) : (
              <>
                依頼主がこのお願いを打ち切りました。案内リンクは無効で、このスレには書けません。
              </>
            )}
          </p>
        ) : null}
        {row.status === "declined" ? (
          <p className="mt-4 rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2 text-[12px] leading-relaxed text-viscum-muted">
            {isSeeder ? (
              <>
                相手が辞退しました。案内リンクは無効です。続ける場合は
                <Link
                  href="/new/request"
                  className="text-viscum-brand underline"
                >
                  新しい直依頼
                </Link>
                を作ってください。
              </>
            ) : (
              <>辞退済みです。案内リンクは無効で、このスレには書けません。</>
            )}
          </p>
        ) : null}

        {threadEnded ? null : (
          <form onSubmit={(e) => void send(e)} className="mt-6 space-y-2">
            <label className="sr-only" htmlFor="dm-draft">
              メッセージ
            </label>
            <textarea
              id="dm-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={2000}
              disabled={sending}
              placeholder="すり合わせや提出の本文"
              className="w-full resize-y rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-[14px] text-viscum-ink outline-none focus:border-viscum-brand disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="w-full rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
            >
              {sending ? "送信中…" : "送る"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center">
          <Link
            href="/dashboard/messages"
            className="inline-flex rounded-md border border-viscum-line bg-white/70 px-4 py-2.5 text-sm font-medium text-viscum-ink hover:bg-viscum-paper-2"
          >
            DM一覧に戻る
          </Link>
        </p>
        </div>
      </main>
    </BrowseChrome>
  );
}
