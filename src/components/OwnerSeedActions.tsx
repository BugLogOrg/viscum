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
import { markJustPublished } from "@/lib/just-published";
import { buildCachedOutboundShareText } from "@/lib/outbound-invite-share";
import { displayAccountName, readLocalProfile } from "@/lib/local-profile";
import { ShareTextCopyButton } from "@/components/ShareTextCopyButton";
import { PinPurchaseControl } from "@/components/PinPurchaseControl";
import { hasPinIntent, takePinIntent } from "@/lib/pin-intent";

/** 投稿フォームの☑「公開したらすぐピン」→ 公開直後に Checkout へ。失敗は公開を止めない */
async function startPinCheckoutAfterPublish(workId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/checkout/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workId }),
    });
    const data = (await res.json().catch(() => null)) as
      | { url?: string; error?: string; nextFreeAtIso?: string | null }
      | null;
    if (res.ok && data?.url) {
      window.location.assign(data.url);
      return true;
    }
    const next = data?.nextFreeAtIso
      ? `（次の空き ${new Date(data.nextFreeAtIso).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} 頃）`
      : "";
    window.alert(
      `公開は完了しました。ピンは付けられませんでした：${data?.error ?? "エラー"}${next}\n作品ページの「シーダー操作」からいつでも付けられます。`,
    );
  } catch {
    window.alert(
      "公開は完了しました。ピンの決済画面を開けませんでした。作品ページの「シーダー操作」からいつでも付けられます。",
    );
  }
  return false;
}

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
  work?: Pick<
    Work,
    | "persisted"
    | "listedOnShelf"
    | "title"
    | "externalUrl"
    | "focusNote"
    | "status"
    | "prizeYen"
    | "plan"
  >;
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
            直依頼用メモ（シード棚には出ません・本人のみ）
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
              下書きに戻す（シード棚から外す）
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
                markJustPublished(workId);
                router.push("/");
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
            下書きに戻す（シード棚から外す）
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className="rounded-md bg-viscum-berry px-3 py-1.5 text-[13px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
            onClick={() => {
              if (
                !window.confirm(
                  hasPinIntent(workId)
                    ? "トップの「反応を募集中」に公開しますか？誰でもURLで見られるようになります。\n\n公開のあと、そのまま「ピン」の決済（¥3,000／1週）に進みます。"
                    : "トップの「反応を募集中」に公開しますか？誰でもURLで見られるようになります。",
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
                  const wantPin = takePinIntent(workId);
                  if (data.work) {
                    const r = await announcePublishedSeedToX(data.work);
                    const msg = announceResultMessage(r);
                    if (msg) window.alert(msg);
                  }
                  markJustPublished(workId);
                  if (wantPin) {
                    // Stripe へ遷移できたらここで離脱。戻り先は /w/{id}?pin=success
                    const left = await startPinCheckoutAfterPublish(workId);
                    if (left) return;
                    router.refresh();
                    return;
                  }
                  router.push("/");
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            {hasPinIntent(workId)
              ? "公開してピンを付ける（トップに出す → ¥3,000）"
              : "公開する（トップに出す）"}
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
      {listedNeon &&
      work?.status === "open" &&
      (work.prizeYen ?? 0) > 0 &&
      work.plan !== "free_comment" ? (
        <PinPurchaseControl workId={workId} />
      ) : null}
    </div>
  );
}
