import Link from "next/link";
import type { Work } from "@/data/dummy-works";
import {
  formatDeadlineFeed,
  formatMonthDay,
  formatHoursAgo,
  formatYen,
  postedAtFromHoursAgo,
  planBadgeLabel,
  getWorkReactionCounts,
} from "@/data/dummy-works";
import { FeedThumbReactions } from "@/components/FeedThumbReactions";
import { SeederNameText } from "@/components/SeederNameText";

/** note 見出し画像と同じ比率（1280×670 ≈ 1.91:1）。詳細・投稿プレビューでも参照 */
export const THUMB_ASPECT = "aspect-[1280/670]";

const TONE: Record<Work["thumbTone"], string> = {
  leaf: "bg-viscum-leaf-deep",
  moss: "bg-viscum-moss",
  berry: "bg-viscum-berry",
  bark: "bg-viscum-bark",
  trunk: "bg-viscum-trunk",
};

function mediaLine(work: Work): string | null {
  const tags = work.tags.filter(Boolean).slice(0, 2);
  if (tags.length === 0) return null;
  return tags.join(" · ");
}

function showCompBlock(work: Work): boolean {
  if (work.status === "closed") return false;
  if (work.status === "none" && !work.prizeYen) return false;
  return (
    work.status === "open" ||
    work.status === "pay_soon" ||
    (work.prizeYen != null && work.prizeYen > 0)
  );
}

/**
 * フィード行 — サムネ上置き・作品 × 反応 × コンペ。
 * 金額は一塊に残すが本文と同系サイズ（金額だけ巨大化しない）。
 */
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
  const planLabel = planBadgeLabel(work.plan);
  const media = mediaLine(work);
  const commentN = work.comments.length;
  const comp = showCompBlock(work);

  return (
    <article
      className={`border-b border-viscum-line px-3 py-3 transition hover:bg-viscum-paper-2/80 ${className}`}
    >
      {/* サムネ全面上置き */}
      <Link
        href={`/w/${work.id}`}
        className={`relative block w-full overflow-hidden rounded-md ${THUMB_ASPECT} ${TONE[work.thumbTone]}`}
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

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <Link
          href={`/w/${work.id}`}
          className="min-w-0 text-[13px] font-medium text-viscum-ink active:opacity-90"
        >
          <span aria-hidden className="mr-1">
            💬
          </span>
          {commentN}
          <span className="ml-0.5 font-normal text-viscum-muted">件の反応</span>
        </Link>
        <FeedThumbReactions
          workId={work.id}
          title={work.title}
          bookmarkBase={rx.bookmark}
        />
      </div>

      <Link
        href={`/w/${work.id}`}
        className="mt-1.5 block min-w-0 active:opacity-90"
      >
        <h2 className="text-[15px] font-semibold leading-snug text-viscum-ink line-clamp-3">
          {work.title}
        </h2>
        {media ? (
          <p className="mt-0.5 text-[12px] leading-snug text-viscum-muted">
            {media}
          </p>
        ) : null}

        {comp ? (
          <div className="mt-2 rounded-md border border-viscum-line bg-viscum-paper-2 px-2.5 py-1.5">
            <p className="text-[13px] leading-snug text-viscum-ink">
              <span className="font-medium">
                {planLabel ??
                  (work.status === "pay_soon" ? "決済準備中" : "コンペ開催中")}
              </span>
              {work.prizeYen != null && work.prizeYen > 0 ? (
                <>
                  <span aria-hidden className="mx-1.5 text-viscum-muted">
                    ·
                  </span>
                  <span className="tabular-nums font-medium text-viscum-berry-deep">
                    {formatYen(work.prizeYen)}
                  </span>
                </>
              ) : null}
            </p>
            {deadline ? (
              <p
                className="mt-0.5 text-[12px] text-viscum-muted"
                title={
                  work.closesInHours != null ? `締切 ${deadline}` : undefined
                }
              >
                締切 {deadline}
              </p>
            ) : null}
          </div>
        ) : work.status === "closed" ? (
          <p className="mt-2 text-[12px] text-viscum-muted">
            {work.paymentsDone && work.paymentsDone > 0
              ? "終了 · 支払い済み"
              : "終了"}
          </p>
        ) : (
          <p className="mt-2 text-[12px] text-viscum-muted">
            {planLabel ?? "コメント歓迎"}
          </p>
        )}

        <p className="mt-1.5 truncate text-[11px] text-viscum-muted">
          <span title={`投稿 ${formatHoursAgo(work.hoursAgo)}`}>
            {postedShort}
          </span>
          <span aria-hidden className="mx-1">
            ·
          </span>
          <span className="text-viscum-trunk" title="シーダー">
            <SeederNameText
              handle={work.seeder}
              preferredName={work.seederAccountName}
            />
          </span>
        </p>
      </Link>
    </article>
  );
}
