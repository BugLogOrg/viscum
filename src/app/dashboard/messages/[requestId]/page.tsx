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
  isLegacyLocalRequestId,
  isRequestDeadlinePassed,
  statusLabel,
  type RequestDm,
} from "@/lib/local-request-dms";
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

  useEffect(() => {
    clearLocalRequestDms();
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!handle) {
      setLoading(false);
      return;
    }
    if (isLegacyLocalRequestId(requestId)) {
      setRow(null);
      setError(
        "これは移行前の端末内データです。相手には届いていません。直依頼画面から送り直してください。",
      );
      setLoading(false);
      return;
    }
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
  }, [handle, requestId]);

  useEffect(() => {
    if (!row?.inviteId || row.workThumbUrl?.trim()) {
      setInviteThumb(null);
      return;
    }
    let cancelled = false;
    void fetch(`/api/dm-invites?id=${encodeURIComponent(row.inviteId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          invite?: { workThumbUrl?: string };
        };
        if (cancelled) return;
        const t = data.invite?.workThumbUrl?.trim();
        setInviteThumb(t && /^https?:\/\//i.test(t) ? t : null);
      })
      .catch(() => {
        if (!cancelled) setInviteThumb(null);
      });
    return () => {
      cancelled = true;
    };
  }, [row?.inviteId, row?.workThumbUrl]);

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

  if (status === "loading" || (handle && loading)) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/dashboard/messages" hideOnMd hidePostCta />
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
  const inviteHref = row.inviteId
    ? `/dm/i/${encodeURIComponent(row.inviteId)}`
    : null;
  const amountYen = row.amountYen;
  const workExternalUrl =
    row.workExternalUrl?.trim() || liveWork?.externalUrl?.trim() || "";

  async function refresh() {
    const res = await fetchRequestDm(requestId);
    if (res.request) setRow(res.request);
  }

  async function copyOutboundAgain() {
    if (!inviteHref || !origin || !row) return;
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

  async function copyInviteUrlOnly() {
    if (!inviteHref || !origin) return;
    try {
      await navigator.clipboard?.writeText(`${origin}${inviteHref}`);
      setCopyNote("招待URLをコピーしました");
    } catch {
      setCopyNote("コピーに失敗しました");
    }
  }

  async function respond(next: "accepted" | "declined") {
    if (responding) return;
    setResponding(true);
    try {
      const res = await patchRequestDm(requestId, { status: next });
      if (res.request) setRow(res.request);
      else await refresh();
    } finally {
      setResponding(false);
    }
  }

  async function runStatus(
    next: "pay_waiting" | "paid" | "closed",
    extendDays?: number,
  ) {
    if (responding) return;
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
            状態: {statusLabel(row.status)}
            {inviteHref ? (
              <>
                {" · "}
                <Link
                  href={inviteHref}
                  className="font-medium text-viscum-brand underline"
                >
                  送付用ページ（正本）
                </Link>
              </>
            ) : null}
          </p>
          {row.outboundUnassigned ? (
            <p className="mt-2 rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2 text-[12px] leading-relaxed text-viscum-muted">
              相手はまだ決まっていません。下のお願いカードは送付用リンクと同じ内容です。案内を渡して返事を待っています。
            </p>
          ) : null}
          {isSeeder && inviteHref ? (
            <div className="mt-2 flex flex-wrap gap-2">
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
                onClick={() => {
                  void copyInviteUrlOnly();
                }}
                className="rounded-md border border-viscum-line px-3 py-1.5 text-[12px] font-medium text-viscum-ink"
              >
                URLだけコピー
              </button>
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
                <span className="block">あなたが送ったお願い</span>
                <span className="mt-1 block text-[12px] font-normal text-viscum-muted">
                  相手が見る送付用ページと同じ内容です
                </span>
              </>
            ) : undefined
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
        {isRequestDeadlinePassed(row.closesAt) &&
        row.status !== "paid" &&
        row.status !== "declined" &&
        row.status !== "closed" ? (
          <p className="mt-4 rounded-md border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-2 text-[12px] leading-relaxed text-viscum-ink">
            希望日を過ぎています（即失効ではありません）。依頼主は延長するか、打ち切れます。
          </p>
        ) : null}

        {isRecipient && row.status === "pending" && (
          <div className="mt-4 flex gap-2">
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
              onClick={() => void respond("declined")}
              className="flex-1 rounded-md border border-viscum-line bg-white/70 px-3 py-2.5 text-[14px] font-medium text-viscum-ink hover:bg-viscum-paper-2 disabled:opacity-50"
            >
              いまは無理
            </button>
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
        (row.status === "pending" ||
          row.status === "accepted" ||
          row.status === "pay_waiting") ? (
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
            <button
              type="button"
              disabled={responding}
              onClick={() => void runStatus("closed")}
              className="rounded-md border border-viscum-berry/40 px-3 py-1.5 text-[12px] font-medium text-viscum-berry-deep disabled:opacity-50"
            >
              打ち切る
            </button>
          </div>
        ) : null}

        {row.status === "paid" ? (
          <p className="mt-4 rounded-md border border-viscum-brand/30 bg-viscum-leaf-soft/40 px-3 py-2 text-[12px] text-viscum-ink">
            支払済です。
          </p>
        ) : null}
        {row.status === "closed" ? (
          <p className="mt-4 rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2 text-[12px] text-viscum-muted">
            このお願いは打ち切られています。
          </p>
        ) : null}

        <ul className="mt-5 space-y-3">
          {threadMessages.map((m) => {
            const mine = m.fromHandle.toLowerCase() === me;
            const name = mine
              ? displayAccountName(handle, readLocalProfile(handle))
              : m.fromHandle === row.fromHandle
                ? row.fromAccountName || m.fromHandle
                : m.fromHandle;
            return (
              <li
                key={m.id}
                className={`rounded-lg border px-3 py-2.5 text-[14px] leading-relaxed ${
                  mine
                    ? "ml-6 border-viscum-brand/25 bg-viscum-leaf-soft/40"
                    : "mr-6 border-viscum-line bg-white/60"
                }`}
              >
                <p className="text-[11px] text-viscum-muted">
                  {name} · @{m.fromHandle}
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
            placeholder="続きのすり合わせ（このご依頼だけ）"
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
        </div>
      </main>
    </BrowseChrome>
  );
}
