import Link from "next/link";
import type { Work } from "@/data/dummy-works";
import {
  formatDeadlineFeed,
  formatYen,
  planBadgeLabel,
  getWorkReactionCounts,
} from "@/data/dummy-works";
import { FeedThumbReactions } from "@/components/FeedThumbReactions";
import { SeederNameText } from "@/components/SeederNameText";

/** note 見出し画像と同じ比率（1280×670 ≈ 1.91:1）。詳細・投稿プレビューでも参照 */
export const THUMB_ASPECT = "aspect-[1280/670]";

/** フィード左カラム幅（旧 9.5rem の約 1.2 倍） */
const FEED_THUMB_W = "w-[11.4rem]";

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
 * フィード行 — 左: サムネ → コンペ帯／右: 作品×反応・シーダー・気になる（右下）。
 * タイトルは入力上限（100字）どおり全表示。
 */
export function WorkFeedRow({
  work,
  className = "",
}: {
  work: Work;
  className?: string;
}) {
  const deadline = formatDeadlineFeed(work.closesInHours, work.status);
  const rx = getWorkReactionCounts(work);
  const planLabel = planBadgeLabel(work.plan);
  const media = mediaLine(work);
  const commentN = work.comments.length;
  const comp = showCompBlock(work);

  return (
    <article
      className={`flex gap-2.5 border-b border-viscum-line px-3 py-2.5 transition hover:bg-viscum-paper-2/80 ${className}`}
    >
      <div className={`${FEED_THUMB_W} shrink-0 self-start`}>
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

        {comp ? (
          <div className="mt-1.5 rounded-md border border-viscum-line bg-viscum-paper-2 px-1.5 py-1">
            <p className="text-[11px] leading-snug text-viscum-ink">
              <span className="font-medium">
                {planLabel ??
                  (work.status === "pay_soon" ? "決済準備中" : "コンペ開催中")}
              </span>
              {work.prizeYen != null && work.prizeYen > 0 ? (
                <>
                  <span aria-hidden className="mx-1 text-viscum-muted">
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
                className="mt-0.5 text-[10px] leading-snug text-viscum-muted"
                title={
                  work.closesInHours != null ? `締切 ${deadline}` : undefined
                }
              >
                締切 {deadline}
              </p>
            ) : null}
          </div>
        ) : null}
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

          <p className="mt-1.5 text-[13px] font-medium leading-none text-viscum-ink">
            <span aria-hidden className="mr-1">
              💬
            </span>
            {commentN}
            <span className="ml-0.5 font-normal text-viscum-muted">件の反応</span>
          </p>

          {!comp && work.status === "closed" ? (
            <p className="mt-2 text-[12px] text-viscum-muted">
              {work.paymentsDone && work.paymentsDone > 0
                ? "終了 · 支払い済み"
                : "終了"}
            </p>
          ) : null}
          {!comp && work.status !== "closed" ? (
            <p className="mt-2 text-[12px] text-viscum-muted">
              {planLabel ?? "コメント歓迎"}
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
            <FeedThumbReactions
              workId={work.id}
              title={work.title}
              bookmarkBase={rx.bookmark}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
