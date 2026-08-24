"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { announcePublishedSeedToX, announceResultMessage } from "@/lib/announce-published-seed";

/**
 * シーダー本人だけ：棚から外す／削除。
 * local_* 以外（デモ棚）には出さない。
 */
export function OwnerSeedActions({
  workId,
  seederHandle,
}: {
  workId: string;
  seederHandle: string;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seed, setSeed] = useState<LocalSeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handle = session?.user?.handle?.trim() ?? "";
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
    if (!isClientSeedId(workId)) {
      setSeed(null);
      return;
    }
    setSeed(readLocalSeeds().find((s) => s.id === workId) ?? null);
  }, [workId]);

  if (!isClientSeedId(workId)) return null;
  if (status === "loading") return null;
  if (!isLocalSeedOwner(seed ?? stub, handle)) return null;

  const listed = seed ? isLocalSeedListed(seed) : false;
  const direct = seed ? isDirectRequestLane(seed) : workId.startsWith("drq_");

  if (direct) {
    return (
      <div className="rounded-lg border border-viscum-line bg-white/60 px-3 py-3 space-y-2">
        <p className="text-[12px] font-medium text-viscum-ink">
          直依頼用メモ（棚には出ません）
        </p>
        <Link
          href={`/w/${encodeURIComponent(workId)}/request`}
          className="inline-flex rounded-md bg-viscum-berry px-3 py-1.5 text-[13px] font-medium text-white hover:bg-viscum-berry-deep"
        >
          直依頼を続ける
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-viscum-line bg-white/60 px-3 py-3 space-y-2">
      <p className="text-[12px] font-medium text-viscum-ink">
        シーダー操作（本人のみ）
      </p>
      <p className="text-[11px] leading-relaxed text-viscum-muted">
        公開の取り消しは「下書きに戻す」。完全に消すときは「削除」。ログイン中のシーダー本人だけ操作できます。
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
                  "トップの「みんなの作品」に公開しますか？",
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
              void announcePublishedSeedToX(workFromLocalSeed(row)).then(
                (r) => {
                  const msg = announceResultMessage(r);
                  if (msg) window.alert(msg);
                  router.push(`/?published=${encodeURIComponent(workId)}`);
                },
              );
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
                "このシードを削除しますか？トップからも詳細からも消えます（デモ端末内データ）。成績（閲覧・気になる等）も一緒に消えます。",
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
      {!listed && seed ? (
        <p className="text-[12px] leading-relaxed text-viscum-muted">
          いまは下書き（未公開）です。公開しても成績の数字はそのまま残ります。{" "}
          <Link href="/dashboard#drafts" className="text-viscum-brand underline">
            下書き一覧へ
          </Link>
        </p>
      ) : null}
      {error ? (
        <p className="text-[12px] text-viscum-berry-deep">{error}</p>
      ) : null}
    </div>
  );
}
