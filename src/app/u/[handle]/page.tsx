import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { WorkFeedRow } from "@/components/WorkFeedRow";
import { FollowButton } from "@/components/FollowButton";
import { PortfolioBio } from "@/components/PortfolioBio";
import {
  formatYen,
  getMentorFacts,
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
  const mentor = getMentorFacts(display);
  const hasPayHistory = pay.paymentsCount > 0;
  const hasMentorHistory =
    mentor.adoptedCount > 0 || mentor.tipsReceivedCount > 0;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/" />

      <header className="border-b border-viscum-line px-4 py-5">
        <p className="text-xs text-viscum-muted">
          シーダー／メンター
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

        {/* 二面：シーダー実績｜メンター実績（スマホは縦並び） */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-viscum-line bg-viscum-paper-2/60 px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-medium text-viscum-ink">
                シーダー実績
              </p>
              {hasPayHistory ? (
                <span className="rounded-full bg-viscum-berry/15 px-2 py-0.5 text-[11px] font-medium text-viscum-berry-deep">
                  支払いあり
                </span>
              ) : (
                <span className="rounded-full bg-viscum-line/60 px-2 py-0.5 text-[11px] text-viscum-muted">
                  まだなし
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-viscum-muted">払う側の事実</p>
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
          </div>

          <div className="rounded-lg border border-viscum-line bg-viscum-paper-2/60 px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-medium text-viscum-ink">
                メンター実績
              </p>
              {hasMentorHistory ? (
                <span className="rounded-full bg-viscum-leaf-soft px-2 py-0.5 text-[11px] font-medium text-viscum-brand">
                  書く実績あり
                </span>
              ) : (
                <span className="rounded-full bg-viscum-line/60 px-2 py-0.5 text-[11px] text-viscum-muted">
                  まだなし
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-viscum-muted">書く側の事実</p>
            <dl className="mt-2 space-y-0.5 text-[14px] text-viscum-ink">
              <div>
                <dt className="inline text-viscum-muted">採用された：</dt>
                <dd className="inline tabular-nums">
                  {mentor.adoptedCount}件
                </dd>
              </div>
              <div>
                <dt className="inline text-viscum-muted">チップ受取：</dt>
                <dd className="inline tabular-nums">
                  {mentor.tipsReceivedCount}件
                </dd>
              </div>
              <div>
                <dt className="inline text-viscum-muted">累計受取：</dt>
                <dd className="inline tabular-nums text-viscum-ink">
                  {formatYen(mentor.tipsReceivedYenTotal)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-snug text-viscum-muted">
          どちらもスコアや順位ではありません。決済・採用が完了した件数と金額の事実です。メンターの累計受取は「いくら稼いだ自慢」ではなく、ちゃんと払われた透明性のための表示です。
        </p>

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
