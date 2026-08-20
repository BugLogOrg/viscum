import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { SeederLink } from "@/components/SeederLink";
import { SeededShareBanner } from "@/components/SeededShareBanner";
import { LocalSeedVisibilityNote } from "@/components/LocalSeedVisibilityNote";
import { OwnerSeedActions } from "@/components/OwnerSeedActions";
import { WorkEngage } from "@/components/WorkEngage";
import { WorkReactionBar } from "@/components/WorkReactionBar";
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

const TONE: Record<Work["thumbTone"], string> = {
  leaf: "bg-viscum-leaf-deep",
  moss: "bg-viscum-moss",
  berry: "bg-viscum-berry",
  bark: "bg-viscum-bark",
  trunk: "bg-viscum-trunk",
};

/** `/w/[id]` の本体。デモ作品も端末内シードも同じ見た目 */
export function WorkDetailBody({ work }: { work: Work }) {
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
  const localDemo = work.id.startsWith("local_");

  return (
    <div className="max-w-lg">
      <Suspense fallback={null}>
        <SeededShareBanner work={work} />
      </Suspense>
      <article>
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

          <p className="text-[15px] leading-relaxed text-viscum-ink">
            {work.description}
          </p>

          {scaffoldLines.length > 0 && scaffoldLabel && (
            <div className="rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
              <p className="text-[13px] font-medium text-viscum-ink">
                {scaffoldLabel}
              </p>
              <p className="mt-0.5 text-[11px] text-viscum-muted">
                {work.plan === "public_boost"
                  ? "テンプレは足場です。報告コメントでは投稿URLなども含めてください。"
                  : "テンプレは足場です。そのまま答えても、アレンジしても構いません。"}
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

          <WorkReactionBar
            workId={work.id}
            title={work.title}
            sukiBase={rx.suki}
            bookmarkBase={rx.bookmark}
          />

          <OwnerSeedActions workId={work.id} seederHandle={work.seeder} />

          <WorkEngage
            workId={work.id}
            status={work.status}
            prizeYen={work.prizeYen}
            paymentsDone={work.paymentsDone}
            deadlineLine={deadlineLine}
            initialComments={work.comments}
            hasAdoptedUntipped={hasAdoptedUntipped}
            scaffoldLabel={scaffoldLabel ?? undefined}
            scaffoldLines={scaffoldLines}
          />
        </div>
      </article>

      <p className="px-4 pb-10 text-center text-sm">
        <Link href="/" className="text-viscum-brand hover:underline">
          TOP
        </Link>
      </p>
    </div>
  );
}
