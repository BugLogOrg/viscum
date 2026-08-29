"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Work } from "@/data/dummy-works";
import {
  deleteLocalSeed,
  isClientSeedId,
  isDirectRequestLane,
  isLocalSeedListed,
  isLocalSeedOwner,
  publishLocalSeedToShelf,
  readLocalSeeds,
  unlistLocalSeed,
  workFromLocalSeed,
  type LocalSeed,
} from "@/lib/local-seeds";
import { isNeonWorkId } from "@/lib/neon-works";
import { announcePublishedSeedToX, announceResultMessage } from "@/lib/announce-published-seed";
import { buildCachedOutboundShareText } from "@/lib/outbound-invite-share";
import { displayAccountName, readLocalProfile } from "@/lib/local-profile";
import { ShareTextCopyButton } from "@/components/ShareTextCopyButton";

/**
 * シーダー本人だけ：公開／下書き戻し／削除。
 * Neon UUID 作品と端末内 local_* の両方。
 */
export function OwnerSeedActions({
  workId,
  seederHandle,
  work,
}: {
  workId: string;
  seederHandle: string;
  /** Neon作品の公開状態など（あれば優先） */
  work?: Pick<Work, "persisted" | "listedOnShelf" | "title" | "externalUrl" | "focusNote">;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seed, setSeed] = useState<LocalSeed | null>(null);
  const [listedNeon, setListedNeon] = useState(
    () => work?.listedOnShelf === true,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  const handle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";
  const neon = Boolean(work?.persisted) || isNeonWorkId(workId);
  const local = isClientSeedId(workId);

  const stub: LocalSeed = {
    id: workId,
    seederHandle,
    title: "",
    description: "",
    externalUrl: "",
    tags: [],
    status: "none",
    viewCount: 0,
    emoCount: 0,
    bookmarkCount: 0,
    commentCount: 0,
    createdAt: "",
  };

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!local) {
      setSeed(null);
      return;
    }
    setSeed(readLocalSeeds().find((s) => s.id === workId) ?? null);
  }, [workId, local]);

  useEffect(() => {
    if (work?.listedOnShelf != null) setListedNeon(work.listedOnShelf);
  }, [work?.listedOnShelf]);

  if (status === "loading") return null;

  const ownerLocal = local && isLocalSeedOwner(seed ?? stub, handle);
  const ownerNeon =
    neon &&
    handle.length > 0 &&
    handle.toLowerCase() === seederHandle.replace(/^@/, "").trim().toLowerCase();

  if (!ownerLocal && !ownerNeon) return null;

  if (local) {
    const listed = seed ? isLocalSeedListed(seed) : false;
    const direct = seed ? isDirectRequestLane(seed) : workId.startsWith("drq_");
    const fromLabel = displayAccountName(handle, readLocalProfile(handle));

    if (direct) {
      return (
        <div className="rounded-lg border border-viscum-line bg-white/60 px-3 py-3 space-y-2">
          <p className="text-[12px] font-medium text-viscum-ink">
            直依頼用メモ（棚には出ません・本人のみ）
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/w/${encodeURIComponent(workId)}/request`}
              className="inline-flex rounded-md bg-viscum-berry px-3 py-1.5 text-[13px] font-medium text-white hover:bg-viscum-berry-deep"
            >
              直依頼を続ける
            </Link>
            <ShareTextCopyButton
              label="案内文をコピー"
              emptyHint="先に直依頼画面でリンクを確定してください"
              getText={() => {
                if (!seed || !origin || !handle) return null;
                return buildCachedOutboundShareText({
                  workId: seed.id,
                  workTitle: seed.title,
                  workExternalUrl: seed.externalUrl,
                  focusNote: seed.focusNote,
                  fromHandle: handle,
                  fromLabel,
                  origin,
                });
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-viscum-line bg-white/60 px-3 py-3 space-y-2">
        <p className="text-[12px] font-medium text-viscum-ink">
          シーダー操作（本人のみ・端末内）
        </p>
        <p className="text-[11px] leading-relaxed text-viscum-muted">
          この作品はまだ端末内だけです。ログインして新規シードすると共有URLになります。
        </p>
        <div className="flex flex-wrap gap-2">
          {listed ? (
            <button
              type="button"
              disabled={busy}
              className="rounded-md border border-viscum-line px-3 py-1.5 text-[13px] font-medium text-viscum-ink hover:bg-viscum-paper-2 disabled:opacity-50"
              onClick={() => {
                setError(null);
                setBusy(true);
                const res = unlistLocalSeed(workId, handle);
                setBusy(false);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setSeed(res.seed);
              }}
            >
              下書きに戻す（棚から外す）
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              className="rounded-md bg-viscum-berry px-3 py-1.5 text-[13px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
              onClick={() => {
                if (
                  !window.confirm(
                    "この端末のトップ表示に出します（他の人・他端末には見えません）。共有したいときはログインして新規シードしてください。",
                  )
                ) {
                  return;
                }
                setError(null);
                setBusy(true);
                const row = publishLocalSeedToShelf(workId);
                setBusy(false);
                if (!row) {
                  setError("公開に失敗しました");
                  return;
                }
                setSeed(row);
                router.push(`/?published=${encodeURIComponent(workId)}`);
              }}
            >
              この端末だけで公開
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            className="rounded-md border border-viscum-berry/40 px-3 py-1.5 text-[13px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10 disabled:opacity-50"
            onClick={() => {
              if (
                !window.confirm(
                  "このシードを削除しますか？（端末内データ）",
                )
              ) {
                return;
              }
              setError(null);
              setBusy(true);
              const res = deleteLocalSeed(workId, handle);
              setBusy(false);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              router.push("/");
            }}
          >
            削除する
          </button>
        </div>
        {error ? (
          <p className="text-[12px] text-viscum-berry-deep">{error}</p>
        ) : null}
      </div>
    );
  }

  // Neon
  return (
    <div className="rounded-lg border border-viscum-line bg-white/60 px-3 py-3 space-y-2">
      <p className="text-[12px] font-medium text-viscum-ink">
        シーダー操作（本人のみ）
      </p>
      <p className="text-[11px] leading-relaxed text-viscum-muted">
        サーバに保存済みです。公開するとURLを共有できます。告知文は公開後に「このコンペを広げる」から。
      </p>
      <div className="flex flex-wrap gap-2">
        {listedNeon ? (
          <button
            type="button"
            disabled={busy}
            className="rounded-md border border-viscum-line px-3 py-1.5 text-[13px] font-medium text-viscum-ink hover:bg-viscum-paper-2 disabled:opacity-50"
            onClick={() => {
              void (async () => {
                setError(null);
                setBusy(true);
                try {
                  const res = await fetch(
                    `/api/works/${encodeURIComponent(workId)}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ listedOnShelf: false }),
                    },
                  );
                  if (!res.ok) {
                    setError("下書きに戻せませんでした");
                    return;
                  }
                  setListedNeon(false);
                  router.refresh();
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            下書きに戻す（棚から外す）
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className="rounded-md bg-viscum-berry px-3 py-1.5 text-[13px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
            onClick={() => {
              if (
                !window.confirm(
                  "トップの「みんなの作品」に公開しますか？誰でもURLで見られるようになります。",
                )
              ) {
                return;
              }
              void (async () => {
                setError(null);
                setBusy(true);
                try {
                  const res = await fetch(
                    `/api/works/${encodeURIComponent(workId)}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ listedOnShelf: true }),
                    },
                  );
                  if (!res.ok) {
                    setError("公開に失敗しました");
                    return;
                  }
                  const data = (await res.json()) as { work?: Work };
                  setListedNeon(true);
                  if (data.work) {
                    void announcePublishedSeedToX(data.work).then((r) => {
                      const msg = announceResultMessage(r);
                      if (msg) window.alert(msg);
                      router.push(
                        `/?published=${encodeURIComponent(workId)}`,
                      );
                    });
                  } else {
                    router.push(`/?published=${encodeURIComponent(workId)}`);
                  }
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            公開する（トップに出す）
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          className="rounded-md border border-viscum-berry/40 px-3 py-1.5 text-[13px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10 disabled:opacity-50"
          onClick={() => {
            if (
              !window.confirm(
                "このシードを削除しますか？トップからも詳細からも消えます。",
              )
            ) {
              return;
            }
            void (async () => {
              setError(null);
              setBusy(true);
              try {
                const res = await fetch(
                  `/api/works/${encodeURIComponent(workId)}`,
                  { method: "DELETE" },
                );
                if (!res.ok) {
                  setError("削除に失敗しました");
                  return;
                }
                router.push("/");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          削除する
        </button>
      </div>
      {!listedNeon ? (
        <p className="text-[12px] leading-relaxed text-viscum-muted">
          いまは下書き（未公開）です。URLは作者だけが開けます。
        </p>
      ) : null}
      {error ? (
        <p className="text-[12px] text-viscum-berry-deep">{error}</p>
      ) : null}
    </div>
  );
}
