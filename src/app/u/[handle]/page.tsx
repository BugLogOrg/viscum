import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { WorkFeedRow } from "@/components/WorkFeedRow";
import { FollowButton } from "@/components/FollowButton";
import { PortfolioBio } from "@/components/PortfolioBio";
import {
  formatYen,
  getSeederPayFacts,
  getWorksBySeeder,
} from "@/data/dummy-works";

type Props = { params: Promise<{ handle: string }> };

export default async function SeederPortfolioPage({ params }: Props) {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw);
  const works = getWorksBySeeder(handle);
  const display = works[0]?.seeder ?? handle;
  const pay = getSeederPayFacts(display);
  const hasPayHistory = pay.paymentsCount > 0;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/" />

      <header className="border-b border-viscum-line px-4 py-5">
        <p className="text-xs text-viscum-muted" title="種を撒く人">
          シーダー
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-viscum-ink">
            @{display}
          </h1>
          <FollowButton handle={display} />
        </div>
        <p className="mt-2 text-[14px] text-viscum-muted">
          ポートフォリオ（デモ）
        </p>
        <PortfolioBio handle={display} />

        <div className="mt-4 rounded-lg border border-viscum-line bg-viscum-paper-2/60 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-medium text-viscum-ink">
              支払い実績
            </p>
            {hasPayHistory ? (
              <span className="rounded-full bg-viscum-berry/15 px-2 py-0.5 text-[11px] font-medium text-viscum-berry-deep">
                支払い実績あり
              </span>
            ) : (
              <span className="rounded-full bg-viscum-line/60 px-2 py-0.5 text-[11px] text-viscum-muted">
                まだ支払いなし
              </span>
            )}
          </div>
          <dl className="mt-2 space-y-0.5 text-[14px] text-viscum-ink">
            <div>
              <dt className="inline text-viscum-muted">支払い完了：</dt>
              <dd className="inline tabular-nums">{pay.paymentsCount}件</dd>
            </div>
            <div>
              <dt className="inline text-viscum-muted">累計支払い：</dt>
              <dd className="inline font-semibold tabular-nums">
                {formatYen(pay.paidYenTotal)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] leading-snug text-viscum-muted">
            スコアや順位ではありません。決済が完了した金額と件数の事実です。
          </p>
        </div>

        <p className="mt-3 text-[13px] text-viscum-ink">
          作品 {works.length} 件
        </p>
      </header>

      {works.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-viscum-muted">
          このシーダーの作品はまだありません。
        </p>
      ) : (
        <div>
          {works.map((w) => (
            <WorkFeedRow key={w.id} work={w} />
          ))}
        </div>
      )}

      <p className="px-4 py-8 text-center text-sm">
        <Link href="/" className="text-viscum-brand hover:underline">
          TOP
        </Link>
      </p>
    </div>
  );
}
