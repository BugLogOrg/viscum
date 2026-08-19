import Link from "next/link";
import { getDummyPortfolioWall } from "@/data/dummy-portfolio-wall";
import { formatHoursAgo } from "@/data/dummy-works";
import { LinkifiedText } from "@/components/LinkifiedText";
import { PortfolioWallCompose } from "@/components/PortfolioWallCompose";

function KindBadge({
  kind,
  tradeLabel,
}: {
  kind: "trade" | "guest";
  tradeLabel?: string;
}) {
  if (kind === "guest") {
    return (
      <span className="rounded bg-viscum-line/70 px-1.5 py-0.5 text-[10px] font-medium text-viscum-muted">
        一見
      </span>
    );
  }
  return (
    <span className="rounded bg-viscum-berry/15 px-1.5 py-0.5 text-[10px] font-medium text-viscum-berry-deep">
      取引{tradeLabel ? ` · ${tradeLabel}` : ""}
    </span>
  );
}

/** PF書き込み（ADR-027）。一覧はサーバー描画で必ず見える。投稿フォームだけクライアント */
export function PortfolioWall({ handle }: { handle: string }) {
  const posts = getDummyPortfolioWall(handle);

  return (
    <section
      className="border-b border-viscum-line"
      aria-label="ポートフォリオの書き込み"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 px-4 pt-4">
        <div>
          <p className="text-[13px] font-medium text-viscum-ink">
            書き込み · {posts.length}
          </p>
          <p className="mt-1 max-w-md text-[11px] leading-snug text-viscum-muted">
            取引メモは全文公開（自浄のため）。一見さんも可。運営は原則裁定しません（デモ）。
          </p>
        </div>
        <PortfolioWallCompose handle={handle} />
      </div>

      {posts.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-viscum-muted">
          まだ書き込みはありません。「書く」からデモ投稿できます。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-viscum-line border-t border-viscum-line">
          {posts.map((p) => (
            <li key={p.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <KindBadge kind={p.kind} tradeLabel={p.tradeLabel} />
                <Link
                  href={`/u/${encodeURIComponent(p.author)}`}
                  className="text-[13px] font-medium text-viscum-ink hover:underline"
                >
                  @{p.author}
                </Link>
                <span className="text-[11px] text-viscum-muted">
                  {formatHoursAgo(p.hoursAgo)}
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                <LinkifiedText text={p.body} />
              </p>
              {p.workId && (
                <p className="mt-1.5 text-[11px] text-viscum-muted">
                  案件：
                  <Link
                    href={`/w/${encodeURIComponent(p.workId)}`}
                    className="text-viscum-brand hover:underline"
                  >
                    {p.workTitle ?? p.workId}
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
