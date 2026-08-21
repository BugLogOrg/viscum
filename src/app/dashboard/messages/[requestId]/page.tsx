"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import {
  clearLocalRequestDms,
  formatYen,
  isLegacyLocalRequestId,
  statusLabel,
  type RequestDm,
} from "@/lib/local-request-dms";
import { displayAccountName, readLocalProfile } from "@/lib/local-profile";
import {
  displayRequestWorkTitle,
  isDemoSeed,
  resolveWorkClient,
} from "@/lib/local-seeds";
import { fetchRequestDm, patchRequestDm } from "@/lib/remote-requests";
import { SeederCredibilityLink } from "@/components/SeederCredibilityLink";

export default function RequestDmThreadPage() {
  const params = useParams();
  const requestId = decodeURIComponent(String(params.requestId ?? ""));
  const { data: session, status } = useSession();
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  const [row, setRow] = useState<RequestDm | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearLocalRequestDms();
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

  const peerHandle = isRecipient ? row.fromHandle : row.toHandle;
  const peerLabel = isRecipient
    ? row.fromAccountName || row.fromHandle
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
  const isLocal = row.workId.startsWith("local_");
  const liveWork = resolveWorkClient(row.workId);
  const liveExternal = liveWork?.externalUrl?.trim();
  const externalUrl =
    row.workExternalUrl?.trim() ||
    (liveExternal && liveExternal !== "https://" ? liveExternal : "") ||
    "";
  const thumbUrl =
    row.workThumbUrl?.trim() ||
    liveWork?.thumbUrl?.trim() ||
    "";
  const summary =
    row.workSummary?.trim() ||
    liveWork?.description?.trim().slice(0, 800) ||
    "";
  /** タイトル＝場内シード詳細 `/w/...`（相手端末に無い local_* は注意） */
  const titleHref = `/w/${encodeURIComponent(row.workId)}`;
  const detailReachable = Boolean(liveWork) || !isLocal;
  const isSeeder = row.fromHandle.toLowerCase() === me;
  const statsHref = isLocal
    ? `/dashboard/${encodeURIComponent(row.workId)}`
    : null;

  async function refresh() {
    const res = await fetchRequestDm(requestId);
    if (res.request) setRow(res.request);
  }

  async function respond(next: "accepted" | "declined") {
    const res = await patchRequestDm(requestId, { status: next });
    if (res.request) setRow(res.request);
    else await refresh();
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const res = await patchRequestDm(requestId, { message: text });
    setDraft("");
    if (res.request) setRow(res.request);
    else await refresh();
  }

  return (
    <BrowseChrome>
      <SiteHeader backHref="/dashboard/messages" hideOnMd hidePostCta />
      <main className="mx-auto flex max-w-lg flex-col px-4 pb-8 pt-4">
        <div className="space-y-1 border-b border-viscum-line pb-4">
          <p className="text-[12px] text-viscum-muted">ご依頼DM</p>
          <h1 className="text-lg font-semibold text-viscum-ink">
            {peerLabel}
            <span className="ml-1 text-[13px] font-normal text-viscum-muted">
              @{peerHandle}
            </span>
          </h1>
          <p className="text-[13px] text-viscum-ink">
            <span className="text-viscum-muted">金額 · </span>
            {formatYen(row.amountYen)}
          </p>

          <div className="mt-3 overflow-hidden rounded-lg border border-viscum-line bg-white/80">
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbUrl}
                alt=""
                className="aspect-[1280/670] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[1280/670] w-full items-center justify-center bg-viscum-paper-2 text-[12px] text-viscum-muted">
                サムネ未添付（新しい依頼から送れます）
              </div>
            )}
            <div className="space-y-2 px-3 py-3">
              <p className="text-[14px] font-semibold leading-snug text-viscum-ink">
                {workTitle}
              </p>
              {summary ? (
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-viscum-muted line-clamp-6">
                  {summary}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
                {detailReachable ? (
                  <Link
                    href={titleHref}
                    className="font-medium text-viscum-brand underline"
                  >
                    場内の詳細を開く
                  </Link>
                ) : (
                  <span className="text-viscum-muted">
                    場内詳細はこの端末に無いことがあります（端末内シード）
                  </span>
                )}
                {externalUrl ? (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-viscum-brand underline"
                  >
                    外部の作品を開く
                  </a>
                ) : null}
                {statsHref && isSeeder ? (
                  <Link
                    href={statsHref}
                    className="font-medium text-viscum-muted underline"
                  >
                    成績を見る
                  </Link>
                ) : null}
              </div>
              {!externalUrl && isLocal ? (
                <p className="text-[11px] leading-relaxed text-viscum-muted">
                  相手が確実に見られるよう、シードに外部URL（プロダクト本体）を入れてから直依頼するのがおすすめです。
                </p>
              ) : null}
            </div>
          </div>

          {isDemoSeed(row.workId) && (
            <p className="mt-2 rounded-md border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-2 text-[12px] leading-relaxed text-viscum-ink">
              このご依頼は<strong>見本作品</strong>（{row.workId}
              ）に紐づいています。さっきシードした作品ではありません。完了画面の「サイト内のメンターに頼む」から送り直すと、自分の作品名で残ります。
            </p>
          )}
          <p className="mt-2 text-[12px] text-viscum-muted">
            状態: {statusLabel(row.status)}
          </p>
          {isRecipient ? (
            <SeederCredibilityLink handle={row.fromHandle} className="mt-3" />
          ) : null}
          {pitchText ? (
            <div className="mt-3 rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2">
              <p className="text-[11px] font-medium text-viscum-muted">
                最初のお願い（依頼時）
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                {pitchText}
              </p>
            </div>
          ) : null}
        </div>

        {isRecipient && row.status === "pending" && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void respond("accepted")}
              className="flex-1 rounded-md bg-viscum-berry px-3 py-2.5 text-[14px] font-medium text-white hover:bg-viscum-berry-deep"
            >
              やる
            </button>
            <button
              type="button"
              onClick={() => void respond("declined")}
              className="flex-1 rounded-md border border-viscum-line bg-white/70 px-3 py-2.5 text-[14px] font-medium text-viscum-ink hover:bg-viscum-paper-2"
            >
              いまは無理
            </button>
          </div>
        )}

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
