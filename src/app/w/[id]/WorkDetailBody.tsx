"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { SeederLink } from "@/components/SeederLink";
import { LocalSeedVisibilityNote } from "@/components/LocalSeedVisibilityNote";
import { OwnerSeedActions } from "@/components/OwnerSeedActions";
import { HotOpenRail } from "@/components/HotOpenRail";
import { WorkEngage } from "@/components/WorkEngage";
import { WorkReactionBar } from "@/components/WorkReactionBar";
import { WorkShareBoost } from "@/components/WorkShareBoost";
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
  const [isDraft, setIsDraft] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!isClientSeedId(work.id)) {
      setIsDraft(false);
      return;
    }
    const seed = readLocalSeeds().find((s) => s.id === work.id);
    setIsDraft(Boolean(seed && !isLocalSeedListed(seed)));
  }, [work.id]);

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

          <div className="space-y-4 px-4 py-5">
            <div className="space-y-2">
              <StatusBadge
                status={work.status}
                prizeYen={work.prizeYen}
                paymentsDone={work.paymentsDone}
                planLabel={planBadgeLabel(work.plan)}
              />
              {localDemo && <LocalSeedVisibilityNote workId={work.id} />}
              <dl className="space-y-1 text-[14px] text-viscum-ink">
                <div>
                  <dt className="inline text-viscum-muted">シーダー：</dt>
                  <dd className="inline">
                    <SeederLink
                      handle={work.seeder}
                      preferredName={work.seederAccountName}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="inline text-viscum-muted">投稿：</dt>
                  <dd className="inline">
                    <time dateTime={postedAt.toISOString()}>{postedLine}</time>
                  </dd>
                </div>
                {deadlineLine && (
                  <div>
                    <dt className="inline text-viscum-muted">締切：</dt>
                    <dd
                      className={
                        work.status === "closed"
                          ? "inline text-viscum-muted"
                          : "inline"
                      }
                    >
                      {closesAt && work.status !== "closed" ? (
                        <>
                          <time dateTime={closesAt.toISOString()}>
                            {deadlineLine.replace(/（[^）]+）$/, "")}
                          </time>
                          <span className="font-medium text-viscum-berry-deep">
                            {deadlineLine.match(/（[^）]+）$/)?.[0] ?? ""}
                          </span>
                        </>
                      ) : (
                        deadlineLine
                      )}
                    </dd>
                  </div>
                )}
                {work.tags.length > 0 && (
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                    <dt className="shrink-0 text-viscum-muted">タグ：</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {work.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/?tag=${encodeURIComponent(tag)}`}
                          className="rounded-md border border-viscum-line bg-viscum-paper-2 px-2 py-0.5 text-[12px] text-viscum-trunk hover:border-viscum-brand hover:text-viscum-brand"
                        >
                          {tag}
                        </Link>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <h1 className="text-2xl font-semibold leading-snug text-viscum-ink">
              {work.title}
            </h1>

            {work.focusNote?.trim() ? (
              <div>
                <p className="text-[13px] font-medium text-viscum-ink">ご挨拶</p>
                <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-viscum-ink">
                  {work.focusNote.trim()}
                </p>
              </div>
            ) : null}

            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-viscum-ink">
              {work.description}
            </p>

            {scaffoldLines.length > 0 && scaffoldLabel && (
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
            )}

            {work.externalUrl?.trim() &&
              work.externalUrl.trim() !== "https://" && (
                <p>
                  <a
                    href={work.externalUrl}
                    className="inline-flex text-[17px] font-semibold text-viscum-brand underline decoration-2 underline-offset-4 hover:text-viscum-berry-deep"
                    target="_blank"
                    rel="noreferrer"
                  >
                    作品を開く（外部）
                  </a>
                </p>
              )}

            <OwnerSeedActions workId={work.id} seederHandle={work.seeder} />

            {isDraft ? (
              <p className="rounded-md border border-dashed border-viscum-line px-3 py-3 text-[12px] leading-relaxed text-viscum-muted">
                下書きのため、気になる・コメント・参加はまだ出していません。公開すると使えるようになります。
              </p>
            ) : (
              <>
                <WorkReactionBar
                  workId={work.id}
                  title={work.title}
                  bookmarkBase={rx.bookmark}
                />
                <WorkShareBoost work={work} isDraft={isDraft} />
                <WorkEngage
                  workId={work.id}
                  seederHandle={work.seeder}
                  status={work.status}
                  prizeYen={work.prizeYen}
                  paymentsDone={work.paymentsDone}
                  deadlineLine={deadlineLine}
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

      <HotOpenRail excludeWorkId={work.id} />
    </div>
  );
}
