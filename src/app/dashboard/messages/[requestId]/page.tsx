"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import {
  appendRequestDmMessage,
  formatYen,
  getRequestDm,
  installDemoRequestDms,
  setRequestDmStatus,
  statusLabel,
  type RequestDm,
} from "@/lib/local-request-dms";
import { displayAccountName, readLocalProfile } from "@/lib/local-profile";

export default function RequestDmThreadPage() {
  const params = useParams();
  const requestId = decodeURIComponent(String(params.requestId ?? ""));
  const { data: session, status } = useSession();
  const handle = session?.user?.handle;
  const [row, setRow] = useState<RequestDm | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!handle) return;
    installDemoRequestDms(handle);
    setRow(getRequestDm(requestId));
  }, [handle, requestId]);

  if (status === "loading") {
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
            このご依頼は見つかりません（デモ・端末内）。
          </p>
          <Link
            href="/dashboard/messages"
            className="mt-4 inline-block text-[13px] text-viscum-brand underline"
          >
            一覧へ
          </Link>
        </main>
      </BrowseChrome>
    );
  }

  const isRecipient = row.toHandle === handle;
  const isParty = isRecipient || row.fromHandle === handle;
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

  const peerHandle = isRecipient ? row.fromHandle : row.toHandle;
  const peerLabel = isRecipient
    ? row.fromAccountName || row.fromHandle
    : row.toHandle;

  function refresh() {
    setRow(getRequestDm(requestId));
  }

  function respond(next: "accepted" | "declined") {
    setRequestDmStatus(requestId, next);
    const note =
      next === "accepted" ? "やる、と返しました。" : "いまは無理、と返しました。";
    appendRequestDmMessage(requestId, handle!, note);
    refresh();
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    appendRequestDmMessage(requestId, handle!, draft);
    setDraft("");
    refresh();
  }

  return (
    <BrowseChrome>
      <SiteHeader backHref="/dashboard/messages" hideOnMd hidePostCta />
      <main className="mx-auto flex max-w-lg flex-col px-4 pb-8 pt-4">
        <div className="space-y-1 border-b border-viscum-line pb-4">
          <p className="text-[12px] text-viscum-muted">ご依頼DM · デモ</p>
          <h1 className="text-lg font-semibold text-viscum-ink">
            {peerLabel}
            <span className="ml-1 text-[13px] font-normal text-viscum-muted">
              @{peerHandle}
            </span>
          </h1>
          <p className="text-[13px] text-viscum-muted">
            {formatYen(row.amountYen)} ·{" "}
            <Link
              href={`/w/${encodeURIComponent(row.workId)}`}
              className="text-viscum-brand underline"
            >
              {row.workTitle}
            </Link>
          </p>
          <p className="text-[12px] text-viscum-muted">
            状態: {statusLabel(row.status)}
          </p>
        </div>

        {isRecipient && row.status === "pending" && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => respond("accepted")}
              className="flex-1 rounded-md bg-viscum-berry px-3 py-2.5 text-[14px] font-medium text-white hover:bg-viscum-berry-deep"
            >
              やる
            </button>
            <button
              type="button"
              onClick={() => respond("declined")}
              className="flex-1 rounded-md border border-viscum-line bg-white/70 px-3 py-2.5 text-[14px] font-medium text-viscum-ink hover:bg-viscum-paper-2"
            >
              いまは無理
            </button>
          </div>
        )}

        <ul className="mt-5 space-y-3">
          {row.messages.map((m) => {
            const mine = m.fromHandle === handle;
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
              </li>
            );
          })}
        </ul>

        <form onSubmit={send} className="mt-6 space-y-2">
          <label className="sr-only" htmlFor="dm-draft">
            メッセージ
          </label>
          <textarea
            id="dm-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="続きのすり合わせ（このご依頼だけ）"
            className="w-full resize-y rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-[14px] text-viscum-ink outline-none focus:border-viscum-brand"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="w-full rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
          >
            送る
          </button>
        </form>
      </main>
    </BrowseChrome>
  );
}
