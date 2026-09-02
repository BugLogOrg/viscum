import Link from "next/link";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { FollowButton } from "@/components/FollowButton";
import { PortfolioHeader } from "@/components/PortfolioBio";
import { PortfolioWall } from "@/components/PortfolioWall";
import { SeededWorksPortfolio } from "@/components/SeededWorksPortfolio";
import {
  MentorFactsCard,
  MentoredWorksList,
} from "@/components/MentorPortfolioClient";
import {
  formatYen,
  getWorksBySeeder,
} from "@/data/dummy-works";
import { seederPayFactsForHandle } from "@/db/payment-facts";
import { mentorPortfolioForHandle } from "@/db/mentor-portfolio";
import { listNeonWorksBySeederHandle } from "@/lib/neon-works";

type Props = { params: Promise<{ handle: string }> };

export default async function SeederPortfolioPage({ params }: Props) {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw).replace(/^@/, "").trim();
  const demoWorks = getWorksBySeeder(handle);
  const neonWorks = await listNeonWorksBySeederHandle(handle);
  const byId = new Map(demoWorks.map((w) => [w.id, w]));
  for (const w of neonWorks) byId.set(w.id, w);
  const works = [...byId.values()].sort((a, b) => a.hoursAgo - b.hoursAgo);
  const display =
    neonWorks[0]?.seeder ??
    demoWorks[0]?.seeder ??
    handle;
  const pay = await seederPayFactsForHandle(display);
  const { facts: mentor, participations: mentored } =
    await mentorPortfolioForHandle(display);
  const hasPayHistory = pay.paymentsCount > 0;

  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd />

      <div className="w-full max-w-5xl">
      <header className="border-b border-viscum-line px-4 py-5">
        <PortfolioHeader
          handle={display}
          action={<FollowButton handle={display} />}
        />
      </header>

      {/* プロフィール直下＝実績（信用の看板。棚より先） */}
      <section className="border-b border-viscum-line px-4 py-5">
        <div className="grid gap-2 sm:grid-cols-2 max-w-lg">
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

          <MentorFactsCard
            handle={display}
            initialFacts={mentor}
            initialParticipations={mentored}
          />
        </div>

        <details className="mt-2 max-w-lg group">
          <summary className="cursor-pointer list-none text-[12px] text-viscum-brand underline decoration-viscum-brand/40 underline-offset-2 marker:content-none [&::-webkit-details-marker]:hidden">
            実績について
          </summary>
          <p className="mt-1.5 text-[11px] leading-snug text-viscum-muted">
            どちらもスコアや順位ではありません。シーダー側は決済完了の件数と金額、メンター側の参加作品はコメントした時点の事実です（選出・褒賞は別途）。直依頼の中身・相手一覧はここに出しません。メンターの累計受取は「いくら稼いだ自慢」ではなく、ちゃんと払われた透明性のための表示です。コンペで選ばれた反応は既定で公開されます。
          </p>
        </details>
      </section>

      <SeededWorksPortfolio handle={display} initialWorks={works} />

      <MentoredWorksList
        handle={display}
        initialParticipations={mentored}
      />

      {/* URL の handle を正とする（作品 seeder の display とずらさない） */}
      <PortfolioWall handle={handle} />

      <p className="px-4 py-8 text-center text-sm">
        <Link href="/" className="text-viscum-brand hover:underline">
          TOP
        </Link>
      </p>
      </div>
    </BrowseChrome>
  );
}
