import Link from "next/link";
import { notFound } from "next/navigation";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkEngage } from "@/components/WorkEngage";
import { WorkReactionBar } from "@/components/WorkReactionBar";
import { THUMB_ASPECT } from "@/components/WorkFeedRow";
import {
  closesAtFromHours,
  formatDeadlineLine,
  formatPostedLine,
  getWork,
  postedAtFromHoursAgo,
  planBadgeLabel,
  type Work,
} from "@/data/dummy-works";
import { accountLabelForHandle } from "@/data/suggested-seeders";

const TONE: Record<Work["thumbTone"], string> = {
  leaf: "bg-viscum-leaf-deep",
  moss: "bg-viscum-moss",
  berry: "bg-viscum-berry",
  bark: "bg-viscum-bark",
  trunk: "bg-viscum-trunk",
};

type Props = { params: Promise<{ id: string }> };

export default async function WorkDetailPage({ params }: Props) {
  const { id } = await params;
  const work = getWork(id);
  if (!work) notFound();

  const postedAt = postedAtFromHoursAgo(work.hoursAgo);
  const postedLine = formatPostedLine(work.hoursAgo);
  const deadlineLine = formatDeadlineLine(work.closesInHours, work.status);
  const seeder = accountLabelForHandle(work.seeder);
  const closesAt =
    work.closesInHours != null
      ? closesAtFromHours(work.closesInHours)
      : null;
  const hasAdoptedUntipped = work.comments.some(
    (c) => c.adopted && !c.tipped,
  );

  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd />

      <div className="max-w-lg">
        <article>
          <div
            className={`w-full ${THUMB_ASPECT} ${TONE[work.thumbTone]} flex items-end p-4`}
            style={{ aspectRatio: "1280 / 670" }}
          >
            <span className="text-4xl font-semibold text-white/90">
              {work.title.slice(0, 1)}
            </span>
          </div>

          <div className="space-y-4 px-4 py-5">
            <div className="space-y-2">
              <StatusBadge
                status={work.status}
                prizeYen={work.prizeYen}
                paymentsDone={work.paymentsDone}
                planLabel={planBadgeLabel(work.plan)}
              />
              <dl className="space-y-1 text-[14px] text-viscum-ink">
                <div>
                  <dt className="inline text-viscum-muted">シーダー：</dt>
                  <dd className="inline">
                    <Link
                      href={`/u/${encodeURIComponent(seeder.handle)}`}
                      className="font-medium text-viscum-trunk underline decoration-viscum-line underline-offset-2 hover:text-viscum-brand hover:decoration-viscum-brand"
                      title="ポートフォリオを見る"
                    >
                      {seeder.line}
                    </Link>
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

            {work.prompts && work.prompts.length > 0 && (
              <ul className="list-inside list-disc text-[15px] leading-relaxed text-viscum-ink">
                {work.prompts.map((p) => (
                  <li key={p}>お題: {p}</li>
                ))}
              </ul>
            )}

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

            <WorkReactionBar workId={work.id} title={work.title} />

            <WorkEngage
              workId={work.id}
              status={work.status}
              prizeYen={work.prizeYen}
              paymentsDone={work.paymentsDone}
              deadlineLine={deadlineLine}
              initialComments={work.comments}
              hasAdoptedUntipped={hasAdoptedUntipped}
            />
          </div>
        </article>

        <p className="px-4 pb-10 text-center text-sm">
          <Link href="/" className="text-viscum-brand hover:underline">
            TOP
          </Link>
        </p>
      </div>
    </BrowseChrome>
  );
}
