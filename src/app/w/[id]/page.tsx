import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CommentList } from "@/components/CommentList";
import { THUMB_ASPECT } from "@/components/WorkFeedRow";
import {
  closesAtFromHours,
  formatDeadlineLine,
  formatPostedLine,
  formatYen,
  getWork,
  postedAtFromHoursAgo,
  type Work,
} from "@/data/dummy-works";

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

  const canComment = work.status === "open" || work.status === "pay_soon";
  const postedAt = postedAtFromHoursAgo(work.hoursAgo);
  const postedLine = formatPostedLine(work.hoursAgo);
  const deadlineLine = formatDeadlineLine(work.closesInHours, work.status);
  const closesAt =
    work.closesInHours != null
      ? closesAtFromHours(work.closesInHours)
      : null;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/" />

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
            />
            <dl className="space-y-1 text-[14px] text-viscum-ink">
              <div>
                <dt className="inline text-viscum-muted">シーダー：</dt>
                <dd className="inline">
                  <Link
                    href={`/u/${encodeURIComponent(work.seeder)}`}
                    className="font-medium text-viscum-trunk underline decoration-viscum-line underline-offset-2 hover:text-viscum-brand hover:decoration-viscum-brand"
                    title="ポートフォリオを見る"
                  >
                    @{work.seeder}
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

          {canComment && (
            <p className="text-[15px] leading-relaxed text-viscum-muted">
              見てほしいところは入口です。ここに書かれていないことでも、気づいたら書いて大丈夫です。
            </p>
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

          {(work.status === "open" ||
            work.status === "pay_soon" ||
            work.status === "closed") && (
            <div className="rounded-lg border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-3 text-sm">
              <p className="font-medium text-viscum-berry-deep">コンペ帯</p>
              <p className="mt-1 text-viscum-ink">
                {work.prizeYen
                  ? `賞金 ${formatYen(work.prizeYen)}（広告費として）`
                  : "賞金なし"}
                {deadlineLine ? ` · 締切 ${deadlineLine}` : ""}
                {work.status === "pay_soon" && " · 決済準備中"}
                {work.status === "closed" && " · 受付終了"}
                {typeof work.paymentsDone === "number" &&
                  work.paymentsDone > 0 &&
                  ` · 支払い完了 ${work.paymentsDone}件`}
                {work.status === "open" &&
                  work.paymentsDone === 0 &&
                  work.comments.some((c) => c.adopted && !c.tipped) &&
                  " · 採用済み・支払い待ち"}
              </p>
              {work.status === "closed" &&
                (work.paymentsDone ?? 0) > 0 && (
                  <p className="mt-2 text-[12px] text-viscum-muted">
                    採用時支払いは完了済み。メンターはコメント展開先の「受け取る」から出金（デモ）。
                  </p>
                )}
              {canComment &&
                work.comments.some((c) => c.adopted && !c.tipped) && (
                  <p className="mt-2 text-[12px] text-viscum-muted">
                    決済準備中の先: コメントを展開 →「採用して支払う」で Checkout
                    デモへ。
                  </p>
                )}
              <button
                type="button"
                className="mt-3 w-full rounded-md bg-viscum-berry px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={!canComment}
              >
                {canComment
                  ? "参加してコメント（デモのため無効）"
                  : "コメント受付終了"}
              </button>
            </div>
          )}

          <CommentList
            comments={work.comments}
            status={work.status}
            prizeYen={work.prizeYen}
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
