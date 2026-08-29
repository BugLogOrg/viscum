"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SeederLink } from "@/components/SeederLink";
import { LocalSeedVisibilityNote } from "@/components/LocalSeedVisibilityNote";
import { OwnerSeedActions } from "@/components/OwnerSeedActions";
import { FeedShelfCorners } from "@/components/FeedShelfCorners";
import { WorkEngage } from "@/components/WorkEngage";
import { WorkDetailActionRow } from "@/components/WorkDetailActionRow";
import { THUMB_ASPECT } from "@/components/WorkFeedRow";
import {
  closesAtFromHours,
  formatDeadlineLine,
  formatPostedLine,
  postedAtFromHoursAgo,
  planBadgeLabel,
  getWorkReactionCounts,
  type Work,
} from "@/data/dummy-works";
import { scaffoldForPlan } from "@/data/seed-courses";
import { isClientSeedId, isLocalSeedListed, readLocalSeeds } from "@/lib/local-seeds";
import { isNeonWorkId } from "@/lib/neon-works";

const TONE: Record<Work["thumbTone"], string> = {
  leaf: "bg-viscum-leaf-deep",
  moss: "bg-viscum-moss",
  berry: "bg-viscum-berry",
  bark: "bg-viscum-bark",
  trunk: "bg-viscum-trunk",
};

/** `/w/[id]` の本体。棚シードは常にフル詳細（省略版なし）。下書きは参加UIのみ隠す */
export function WorkDetailBody({ work }: { work: Work }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      }
    >
      <WorkDetailBodyInner work={work} />
    </Suspense>
  );
}

function WorkDetailBodyInner({ work }: { work: Work }) {
  const search = useSearchParams();
  const router = useRouter();
  const [isDraft, setIsDraft] = useState(() =>
    work.persisted ? work.listedOnShelf === false : false,
  );
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (work.persisted) {
      setIsDraft(work.listedOnShelf === false);
      return;
    }
    if (!isClientSeedId(work.id)) {
      setIsDraft(false);
      return;
    }
    const seed = readLocalSeeds().find((s) => s.id === work.id);
    setIsDraft(Boolean(seed && !isLocalSeedListed(seed)));
  }, [work.id, work.persisted, work.listedOnShelf]);

  useEffect(() => {
    if (search.get("seeded") !== "1") return;
    setJustSaved(true);
    router.replace(`/w/${encodeURIComponent(work.id)}`, { scroll: false });
  }, [search, work.id, router]);

  const postedAt = postedAtFromHoursAgo(work.hoursAgo);
  const postedLine = formatPostedLine(work.hoursAgo);
  const deadlineLine = formatDeadlineLine(work.closesInHours, work.status);
  const closesAt =
    work.closesInHours != null
      ? closesAtFromHours(work.closesInHours)
      : null;
  const hasAdoptedUntipped = work.comments.some(
    (c) => c.adopted && !c.tipped,
  );
  const rx = getWorkReactionCounts(work);
  const scaffold =
    work.plan != null ? scaffoldForPlan(work.plan) : null;
  const scaffoldLines = work.prompts?.length
    ? work.prompts
    : (scaffold?.lines ?? []);
  const scaffoldLabel = scaffold?.label ?? null;
  const localDemo = isClientSeedId(work.id);
  const neonPersisted = Boolean(work.persisted) || isNeonWorkId(work.id);
  const externalUrl = work.externalUrl?.trim();
  const externalOk =
    Boolean(externalUrl) && externalUrl !== "https://";
  let externalHost = "";
  if (externalOk && externalUrl) {
    try {
      externalHost = new URL(externalUrl).hostname.replace(/^www\./, "");
    } catch {
      externalHost = "";
    }
  }

  return (
    <div className="xl:flex xl:items-start">
      <div className="w-full max-w-lg shrink-0">
        <article>
          {(justSaved || isDraft) && (
            <div className="space-y-2 border-b border-viscum-berry/25 bg-viscum-berry/5 px-4 py-3">
              {justSaved ? (
                <p className="text-[14px] font-semibold text-viscum-berry-deep">
                  一旦保存しました
                </p>
              ) : null}
              {isDraft ? (
                <p className="text-[13px] leading-relaxed text-viscum-ink">
                  <span className="font-semibold text-viscum-berry-deep">
                    下書き（未公開）
                  </span>
                  です。トップの「すべて」には出ていません。内容はこのまま確認できます。公開するときは下の「公開する」から。
                </p>
              ) : null}
              {justSaved && !isDraft ? (
                <p className="text-[13px] leading-relaxed text-viscum-ink">
                  内容はこのまま確認できます。
                </p>
              ) : null}
            </div>
          )}

          <div
            className={`relative w-full overflow-hidden ${THUMB_ASPECT} ${TONE[work.thumbTone]}`}
            style={{ aspectRatio: "1280 / 670" }}
            aria-hidden={work.thumbUrl ? undefined : true}
          >
            {work.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={work.thumbUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="space-y-5 px-4 py-5">
            {/* A. 読む：タイトル → 上アクション → ご挨拶 → 説明 */}
            <div className="space-y-3">
              <h1 className="text-xl font-semibold leading-snug text-viscum-ink">
                {work.title}
              </h1>
              {!isDraft ? (
                <WorkDetailActionRow
                  work={work}
                  bookmarkBase={rx.bookmark}
                  isDraft={isDraft}
                  variant="icons"
                />
              ) : null}
              <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px] text-viscum-muted">
                <SeederLink
                  handle={work.seeder}
                  preferredName={work.seederAccountName}
                />
                <time dateTime={postedAt.toISOString()}>{postedLine}</time>
              </p>
            </div>

            {work.focusNote?.trim() ? (
              <div>
                <p className="text-[12px] font-medium tracking-wide text-viscum-muted">
                  ご挨拶
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-viscum-ink">
                  {work.focusNote.trim()}
                </p>
              </div>
            ) : null}

            <div>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-viscum-ink">
                {work.description}
              </p>
            </div>

            {externalOk && externalUrl ? (
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg border border-viscum-brand/35 bg-viscum-leaf-soft/50 px-3.5 py-3 transition hover:border-viscum-brand hover:bg-viscum-leaf-soft"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/80 text-viscum-brand">
                  <ExternalGlyph className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-viscum-ink">
                    作品を開く
                  </span>
                  {externalHost ? (
                    <span className="mt-0.5 block truncate text-[12px] text-viscum-muted">
                      {externalHost}
                    </span>
                  ) : (
                    <span className="mt-0.5 block text-[12px] text-viscum-muted">
                      外部サイトで見る
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-viscum-brand" aria-hidden>
                  →
                </span>
              </a>
            ) : null}

            {scaffoldLines.length > 0 && scaffoldLabel ? (
              <div className="rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
                <p className="text-[13px] font-medium text-viscum-ink">
                  {scaffoldLabel}
                  {isDraft ? (
                    <span className="ml-1 text-[11px] font-normal text-viscum-muted">
                      （公開後に相手へ見えます）
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[11px] text-viscum-muted">
                  {work.plan === "public_boost"
                    ? "おすすめの目安です。報告コメントでは投稿URLなども含めてください。"
                    : "おすすめ質問です。そのまま答えても、アレンジしても構いません。"}
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] leading-relaxed text-viscum-ink">
                  {scaffoldLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {localDemo ? <LocalSeedVisibilityNote workId={work.id} /> : null}
            {neonPersisted && !localDemo ? (
              <p className="text-[11px] leading-relaxed text-viscum-muted">
                {isDraft ? (
                  <>
                    <strong className="font-medium text-viscum-berry-deep">
                      未公開
                    </strong>
                    （Neonに保存済み・共有URLは作者のみ）。公開すると他の人も開けます。
                  </>
                ) : (
                  <>
                    トップの棚に
                    <strong className="font-medium text-viscum-ink">公開中</strong>
                    です（サーバ保存）。URLを共有できます。
                  </>
                )}
              </p>
            ) : null}

            <OwnerSeedActions
              workId={work.id}
              seederHandle={work.seeder}
              work={work}
            />

            {isDraft ? (
              <p className="rounded-md border border-dashed border-viscum-line px-3 py-3 text-[12px] leading-relaxed text-viscum-muted">
                下書きのため、気になる・コメント・参加はまだ出していません。公開すると使えるようになります。
              </p>
            ) : (
              <>
                {/* D. 下段アクション（見逃し防止）→ C. 書く */}
                <WorkDetailActionRow
                  work={work}
                  bookmarkBase={rx.bookmark}
                  isDraft={isDraft}
                  variant="row"
                />
                <WorkEngage
                  workId={work.id}
                  seederHandle={work.seeder}
                  status={work.status}
                  prizeYen={work.prizeYen}
                  paymentsDone={work.paymentsDone}
                  planLabel={planBadgeLabel(work.plan)}
                  deadlineLine={deadlineLine}
                  closesAtIso={closesAt?.toISOString() ?? null}
                  tags={work.tags}
                  initialComments={work.comments}
                  hasAdoptedUntipped={hasAdoptedUntipped}
                  scaffoldLabel={scaffoldLabel ?? undefined}
                  scaffoldLines={scaffoldLines}
                />
              </>
            )}
          </div>
        </article>

        <p className="px-4 pb-10 text-center text-sm xl:pb-10">
          <Link href="/" className="text-viscum-brand hover:underline">
            TOP
          </Link>
        </p>
      </div>

      <FeedShelfCorners excludeWorkId={work.id} layout="sideDuo" />
    </div>
  );
}

function ExternalGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
