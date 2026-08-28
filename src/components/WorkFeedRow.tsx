import Link from "next/link";
import type { Work } from "@/data/dummy-works";
import {
  formatDeadlineFeed,
  formatYen,
  planBadgeLabel,
  getWorkReactionCounts,
} from "@/data/dummy-works";
import {
  FeedAttitudeCounts,
  FeedBookmarkButton,
} from "@/components/FeedThumbReactions";
import { SeederNameText } from "@/components/SeederNameText";

/** note 見出し画像と同じ比率（1280×670 ≈ 1.91:1）。詳細・投稿プレビューでも参照 */
export const THUMB_ASPECT = "aspect-[1280/670]";

/** モバイルは狭め・md以上は旧幅に戻す */
const FEED_THUMB_W = "w-[10.25rem] md:w-[11.4rem]";

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

/** サムネ下ステータス帯の中身（開催／無料／終了を一箇所に） */
function feedStatus(work: Work): {
  title: string;
  prizeYen?: number;
  deadline?: string | null;
} | null {
  if (work.status === "closed") {
    return {
      title:
        work.paymentsDone && work.paymentsDone > 0
          ? "終了 · 支払い済み"
          : "終了",
    };
  }
  if (work.plan === "free_comment" || work.status === "none") {
    return {
      title: planBadgeLabel(work.plan) ?? "コメント歓迎",
    };
  }
  if (
    work.status === "open" ||
    work.status === "pay_soon" ||
    (work.prizeYen != null && work.prizeYen > 0)
  ) {
    return {
      title:
        planBadgeLabel(work.plan) ??
        (work.status === "pay_soon" ? "決済準備中" : "コンペ開催中"),
      prizeYen: work.prizeYen,
      deadline: formatDeadlineFeed(work.closesInHours, work.status),
    };
  }
  return null;
}

/**
 * フィード行 — 左: サムネ → ステータス帯 →（下端）気になる／右: 作品・緑青赤件数。
 */
export function WorkFeedRow({
  work,
  className = "",
}: {
  work: Work;
  className?: string;
}) {
  const rx = getWorkReactionCounts(work);
  const media = mediaLine(work);
  const status = feedStatus(work);

  return (
    <article
      className={`flex gap-2.5 border-b border-viscum-line px-3 py-2.5 transition hover:bg-viscum-paper-2/80 ${className}`}
    >
      <div
        className={`${FEED_THUMB_W} flex shrink-0 flex-col self-stretch`}
      >
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

        {status ? (
          <div className="mt-1.5 rounded-md border border-viscum-line bg-viscum-paper-2 px-1.5 py-1">
            <p className="text-[11px] leading-snug text-viscum-ink">
              <span className="font-medium">{status.title}</span>
              {status.prizeYen != null && status.prizeYen > 0 ? (
                <>
                  <span aria-hidden className="mx-1 text-viscum-muted">
                    ·
                  </span>
                  <span className="tabular-nums font-medium text-viscum-berry-deep">
                    {formatYen(status.prizeYen)}
                  </span>
                </>
              ) : null}
            </p>
            {status.deadline ? (
              <p
                className="mt-0.5 break-words text-[12px] leading-snug text-viscum-muted"
                title={
                  work.closesInHours != null
                    ? `締切 ${status.deadline}`
                    : undefined
                }
              >
                締切 {status.deadline}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex justify-start pt-1.5">
          <FeedBookmarkButton
            workId={work.id}
            title={work.title}
            bookmarkBase={rx.bookmark}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/w/${work.id}`} className="min-w-0 active:opacity-90">
          <h2 className="text-[15px] font-semibold leading-snug text-viscum-ink">
            {work.title}
          </h2>
          {media ? (
            <p className="mt-0.5 text-[12px] leading-snug text-viscum-muted">
              {media}
            </p>
          ) : null}
        </Link>

        <div className="mt-auto pt-1.5">
          <Link
            href={`/w/${work.id}`}
            className="block truncate text-[11px] text-viscum-trunk active:opacity-90"
            title="シーダー"
          >
            <SeederNameText
              handle={work.seeder}
              preferredName={work.seederAccountName}
            />
          </Link>
          <div className="mt-1 flex justify-end">
            <FeedAttitudeCounts
              workId={work.id}
              comments={work.comments}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
