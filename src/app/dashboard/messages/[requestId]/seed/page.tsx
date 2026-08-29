"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { DirectRequestOfferCard } from "@/components/DirectRequestOfferCard";
import {
  clearLocalRequestDms,
  isLegacyLocalRequestId,
  type RequestDm,
} from "@/lib/local-request-dms";
import { displayAccountName, readLocalProfile } from "@/lib/local-profile";
import {
  displayRequestWorkTitle,
  resolveWorkClient,
} from "@/lib/local-seeds";
import { fetchRequestDm } from "@/lib/remote-requests";

/**
 * ご依頼DM用のお願い詳細。
 * レイアウト正本は送付用 `/dm/i/…` と同じ DirectRequestOfferCard。
 */
export default function RequestSeedDetailPage() {
  const params = useParams();
  const requestId = decodeURIComponent(String(params.requestId ?? ""));
  const { data: session, status } = useSession();
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  const [row, setRow] = useState<RequestDm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteThumb, setInviteThumb] = useState<string | null>(null);

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

  useEffect(() => {
    if (!row?.inviteId || row.workThumbUrl?.trim()) {
      setInviteThumb(null);
      return;
    }
    let cancelled = false;
    void fetch(
      `/api/dm-invites?id=${encodeURIComponent(row.inviteId)}&lean=1`,
      { cache: "no-store" },
    )
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

  const threadHref = `/dashboard/messages/${encodeURIComponent(requestId)}`;

  if (status === "loading" || (handle && loading)) {
    return (
      <BrowseChrome>
        <SiteHeader backHref={threadHref} hideOnMd hidePostCta />
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
            href={`/login?callbackUrl=${encodeURIComponent(`${threadHref}/seed`)}`}
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
    row.workThumbUrl?.trim() ||
    inviteThumb?.trim() ||
    liveWork?.thumbUrl?.trim() ||
    "";
  const liveBody = (() => {
    if (!liveWork) return "";
    const desc = liveWork.description?.trim() ?? "";
    const focus = (liveWork.prompts ?? [])
      .map((s) => s.trim())
      .filter(Boolean);
    if (focus.length)
      return `${desc}\n\n【聞きたいこと】\n${focus.join("\n")}`.trim();
    return desc;
  })();
  const fromDisplay =
    row.fromAccountName?.trim() ||
    displayAccountName(row.fromHandle, readLocalProfile(row.fromHandle));
  const inviteHref = row.inviteId
    ? `/dm/i/${encodeURIComponent(row.inviteId)}`
    : null;

  return (
    <BrowseChrome>
      <SiteHeader backHref={threadHref} hideOnMd hidePostCta />
      <main className="mx-auto max-w-lg pb-10">
        <p className="px-4 pt-4 text-[12px] text-viscum-muted">
          ご依頼内容の控え（相手に渡す案内ページと同型・下書きではありません）
          {inviteHref ? (
            <>
              {" · "}
              <Link
                href={inviteHref}
                className="font-medium text-viscum-brand underline"
              >
                案内ページを開く
              </Link>
            </>
          ) : null}
        </p>
        <DirectRequestOfferCard
          snapshot={{
            fromDisplayName: fromDisplay,
            fromHandle: row.fromHandle,
            workTitle,
            workExternalUrl:
              row.workExternalUrl?.trim() || liveWork?.externalUrl?.trim(),
            workThumbUrl: thumbUrl || undefined,
            workSummary:
              row.workSummary?.trim() || liveBody || undefined,
            pitch: row.pitch?.trim() || undefined,
            amountYen: row.amountYen,
            createdAt: row.createdAt,
          }}
        />
        <p className="mt-6 px-4 text-center text-[13px]">
          <Link href={threadHref} className="text-viscum-brand underline">
            ← ご依頼DMに戻る
          </Link>
        </p>
      </main>
    </BrowseChrome>
  );
}
