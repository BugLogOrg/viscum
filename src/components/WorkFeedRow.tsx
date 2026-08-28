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

/** note 見出し画像と同じ比率（1280×670 ≈ 1.91:1） */
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
  // 有料コンペ／決済準備、または金額付きの開催
  return (
    work.status === "open" ||
    work.status === "pay_soon" ||
    (work.prizeYen != null && work.prizeYen > 0)
  );
}

/**
 * フィード行 — 作品 × 反応 × コンペ（三本柱）。
 * 金額・締切は消さず一塊に。バッジ散乱をやめる。
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
      className={`flex gap-2.5 border-b border-viscum-line px-3 py-2.5 transition hover:bg-viscum-paper-2/80 ${className}`}
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
        className="min-w-0 flex-1 self-start active:opacity-90"
      >
        {/* ① 作品 */}
        <h2 className="text-[15px] font-semibold leading-snug text-viscum-ink line-clamp-3">
          {work.title}
        </h2>
        {media ? (
          <p className="mt-0.5 text-[12px] leading-snug text-viscum-muted">
            {media}
          </p>
        ) : null}

        {/* ② 反応 */}
        <p className="mt-1.5 text-[14px] font-semibold leading-none text-viscum-ink">
          <span aria-hidden className="mr-1">
            💬
          </span>
          {commentN}
          <span className="ml-1 text-[13px] font-medium text-viscum-ink">
            件の反応
          </span>
        </p>

        {/* ③ コンペ一塊（第二の主役） */}
        {comp ? (
          <div
            className={`mt-2 rounded border px-2.5 py-1.5 ${
              work.status === "pay_soon"
                ? "border-viscum-bark/40 bg-viscum-bark/10"
                : "border-viscum-berry/35 bg-viscum-berry/10"
            }`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[12px] font-semibold text-viscum-berry-deep">
                {planLabel ??
                  (work.status === "pay_soon" ? "決済準備中" : "コンペ開催中")}
              </span>
              {work.prizeYen != null && work.prizeYen > 0 ? (
                <span className="text-[15px] font-bold tabular-nums text-viscum-berry-deep">
                  {formatYen(work.prizeYen)}
                </span>
              ) : null}
            </div>
            {deadline ? (
              <p
                className={`mt-0.5 text-[12px] ${
                  work.status === "closed"
                    ? "text-viscum-muted"
                    : "font-medium text-viscum-berry-deep"
                }`}
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

        {/* 補助メタ（視線の主役にしない） */}
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
