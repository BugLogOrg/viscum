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
  type RequestDm,
} from "@/lib/local-request-dms";
import {
  displayRequestWorkTitle,
  resolveWorkClient,
} from "@/lib/local-seeds";
import { fetchRequestDm } from "@/lib/remote-requests";
import { SeederLink } from "@/components/SeederLink";

/** 依頼時スナップショットから説明と聞くことを分ける */
function splitSeedBody(raw: string): { description: string; focus: string[] } {
  const text = raw.trim();
  if (!text) return { description: "", focus: [] };
  const marker = "【聞くこと】";
  const i = text.indexOf(marker);
  if (i < 0) return { description: text, focus: [] };
  const description = text.slice(0, i).trim();
  const focus = text
    .slice(i + marker.length)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return { description, focus };
}

/**
 * ご依頼DM用のシード詳細。
 * 端末内シード（local_*）は受け手の /w に無いので、依頼に埋め込んだスナップショットで詳細を出す。
 */
export default function RequestSeedDetailPage() {
  const params = useParams();
  const requestId = decodeURIComponent(String(params.requestId ?? ""));
  const { data: session, status } = useSession();
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  const [row, setRow] = useState<RequestDm | null>(null);
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
      setError("移行前の端末内データです。");
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
        <SiteHeader
          backHref={`/dashboard/messages/${encodeURIComponent(requestId)}`}
          hideOnMd
          hidePostCta
        />
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
            href={`/login?callbackUrl=${encodeURIComponent(`/dashboard/messages/${requestId}/seed`)}`}
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
        </main>
      </BrowseChrome>
    );
  }

  const me = handle.toLowerCase();
  const isParty =
    row.toHandle.toLowerCase() === me ||
    row.fromHandle.toLowerCase() === me;
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

  const liveWork = resolveWorkClient(row.workId);
  const workTitle = displayRequestWorkTitle(row.workId, row.workTitle);
  const thumbUrl =
    row.workThumbUrl?.trim() || liveWork?.thumbUrl?.trim() || "";
  const liveBody = (() => {
    if (!liveWork) return "";
    const desc = liveWork.description?.trim() ?? "";
    const focus = (liveWork.prompts ?? [])
      .map((s) => s.trim())
      .filter(Boolean);
    if (focus.length)
      return `${desc}\n\n【聞くこと】\n${focus.join("\n")}`.trim();
    return desc;
  })();
  const { description, focus } = splitSeedBody(
    row.workSummary?.trim() || liveBody,
  );
  const threadHref = `/dashboard/messages/${encodeURIComponent(row.id)}`;

  return (
    <BrowseChrome>
      <SiteHeader backHref={threadHref} hideOnMd hidePostCta />
      <main className="mx-auto max-w-lg pb-10">
        <article>
          <div
            className="relative w-full overflow-hidden bg-viscum-leaf-deep"
            style={{ aspectRatio: "1280 / 670" }}
          >
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-white/80">
                サムネなし
              </div>
            )}
          </div>

          <div className="space-y-4 px-4 py-5">
            <p className="text-[12px] text-viscum-muted">
              ご依頼に紐づくシード詳細
              <span className="mx-1 text-viscum-line">·</span>
              {formatYen(row.amountYen)}
            </p>

            <dl className="space-y-1 text-[14px] text-viscum-ink">
              <div>
                <dt className="inline text-viscum-muted">依頼主：</dt>
                <dd className="inline">
                  <SeederLink
                    handle={row.fromHandle}
                    preferredName={row.fromAccountName}
                  />
                </dd>
              </div>
            </dl>

            <h1 className="text-2xl font-semibold leading-snug text-viscum-ink">
              {workTitle}
            </h1>

            {description ? (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-viscum-ink">
                {description}
              </p>
            ) : (
              <p className="text-[14px] text-viscum-muted">
                本文スナップショットがありません。直依頼を送り直すとここに残ります。
              </p>
            )}

            {focus.length > 0 ? (
              <div className="rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
                <p className="text-[13px] font-medium text-viscum-ink">
                  聞くこと
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] leading-relaxed text-viscum-ink">
                  {focus.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            <p className="rounded-md border border-dashed border-viscum-line px-3 py-2 text-[12px] leading-relaxed text-viscum-muted">
              直依頼向けの詳細です（依頼時のコピー）。棚の公開シードとは別に、当事者だけがここから確認できます。
            </p>

            <p className="text-center text-sm">
              <Link
                href={threadHref}
                className="text-viscum-brand hover:underline"
              >
                ← ご依頼DMに戻る
              </Link>
            </p>
          </div>
        </article>
      </main>
    </BrowseChrome>
  );
}
