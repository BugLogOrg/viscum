import Link from "next/link";
import type { Work } from "@/data/dummy-works";
import {
  formatDeadlineFeed,
  formatMonthDay,
  formatHoursAgo,
  postedAtFromHoursAgo,
  planBadgeLabel,
  getWorkReactionCounts,
} from "@/data/dummy-works";
import { StatusBadge } from "@/components/StatusBadge";
import { FeedThumbReactions } from "@/components/FeedThumbReactions";
import { SeederNameText } from "@/components/SeederNameText";

/** note 見出し画像と同じ比率（1280×670 ≈ 1.91:1） */
export const THUMB_ASPECT = "aspect-[1280/670]";

const TONE: Record<Work["thumbTone"], string> = {
  leaf: "bg-viscum-leaf-deep",
  moss: "bg-viscum-moss",
  berry: "bg-viscum-berry",
  bark: "bg-viscum-bark",
  trunk: "bg-viscum-trunk",
};

/** はてブ密度 × note横長サムネ。説明は詳細へ（タイトルは短め運用） */
export function WorkFeedRow({
  work,
  className = "",
}: {
  work: Work;
  className?: string;
}) {
  const deadline = formatDeadlineFeed(work.closesInHours, work.status);
  const postedShort = formatMonthDay(postedAtFromHoursAgo(work.hoursAgo));
  const rx = getWorkReactionCounts(work);

  return (
    <article
      className={`flex gap-2.5 border-b border-viscum-line px-3 py-2 transition hover:bg-viscum-paper-2/80 ${className}`}
    >
      <div className="w-[9.5rem] shrink-0 self-start">
        <Link
          href={`/w/${work.id}`}
          className={`relative block overflow-hidden rounded ${THUMB_ASPECT} ${TONE[work.thumbTone]}`}
          style={{ aspectRatio: "1280 / 670" }}
          aria-hidden
          tabIndex={-1}
        >
          {work.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={work.thumbUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
        </Link>
        <FeedThumbReactions
          workId={work.id}
          title={work.title}
          bookmarkBase={rx.bookmark}
        />
      </div>
      <Link
        href={`/w/${work.id}`}
        className="min-w-0 flex-1 self-center active:opacity-90"
      >
        <h2 className="text-[15px] font-semibold leading-snug text-viscum-ink line-clamp-4">
          {work.title}
        </h2>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-viscum-muted">
          <StatusBadge
            status={work.status}
            prizeYen={work.prizeYen}
            paymentsDone={work.paymentsDone}
            planLabel={planBadgeLabel(work.plan)}
            dense
          />
          {deadline && (
            <>
              <span
                className={
                  work.status === "closed"
                    ? "text-viscum-muted"
                    : "font-medium text-viscum-berry-deep"
                }
                title={
                  work.closesInHours != null
                    ? `締切 ${deadline}`
                    : undefined
                }
              >
                締切 {deadline}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span title={`投稿 ${formatHoursAgo(work.hoursAgo)}`}>
            投稿 {postedShort}
          </span>
          <span aria-hidden>·</span>
          <span>💬 {work.comments.length}</span>
          <span aria-hidden>·</span>
          <span className="truncate text-viscum-trunk" title="シーダー">
            <SeederNameText
              handle={work.seeder}
              preferredName={work.seederAccountName}
            />
          </span>
        </div>
      </Link>
    </article>
  );
}
