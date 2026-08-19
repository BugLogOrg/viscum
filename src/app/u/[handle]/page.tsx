import Link from "next/link";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { WorkFeedRow } from "@/components/WorkFeedRow";
import { FollowButton } from "@/components/FollowButton";
import { PortfolioHeader } from "@/components/PortfolioBio";
import { PortfolioWall } from "@/components/PortfolioWall";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatYen,
  getMentorFacts,
  getSeederPayFacts,
  getWorksBySeeder,
  getWorksMentoredBy,
  planBadgeLabel,
} from "@/data/dummy-works";
import { accountLabelForHandle } from "@/data/suggested-seeders";

type Props = { params: Promise<{ handle: string }> };

export default async function SeederPortfolioPage({ params }: Props) {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw);
  const works = getWorksBySeeder(handle);
  const display = works[0]?.seeder ?? handle;
  const pay = getSeederPayFacts(display);
  const mentor = getMentorFacts(display);
  const mentored = getWorksMentoredBy(display);
  const hasPayHistory = pay.paymentsCount > 0;
  const hasMentorHistory =
    mentor.participatedCount > 0 ||
    mentor.adoptedCount > 0 ||
    mentor.tipsReceivedCount > 0 ||
    mentored.length > 0;

  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd />

      <div className="max-w-lg">
      <header className="border-b border-viscum-line px-4 py-5">
        <PortfolioHeader
          handle={display}
          action={<FollowButton handle={display} />}
        />

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
                <dt className="inline text-viscum-muted">参加作品：</dt>
                <dd className="inline tabular-nums">
                  {Math.max(mentor.participatedCount, mentored.length)}件
                </dd>
              </div>
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
      </header>

      <section className="border-b border-viscum-line">
        <p className="px-4 pt-4 text-[20px] font-bold text-viscum-ink">
          シードした作品 · {works.length}件
        </p>
        {works.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-viscum-muted">
            まだシードした作品はありません。
          </p>
        ) : (
          <div>
            {works.map((w) => (
              <WorkFeedRow key={w.id} work={w} />
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="px-4 pt-4 text-[20px] font-bold text-viscum-ink">
          メンターとして参加した作品 · {mentored.length}件
        </p>
        <p className="px-4 pt-1 text-[11px] text-viscum-muted">
          コメントした棚。採用・チップはバッジで事実表示します。
        </p>
        {mentored.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-viscum-muted">
            まだ参加した作品はありません。
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-viscum-line border-t border-viscum-line">
            {mentored.map(({ work, adopted, tipped, commentSubject }) => (
              <li key={work.id}>
                <Link
                  href={`/w/${encodeURIComponent(work.id)}`}
                  className="block px-4 py-3 transition hover:bg-viscum-paper-2/80"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge
                      status={work.status}
                      prizeYen={work.prizeYen}
                      planLabel={planBadgeLabel(work.plan)}
                      dense
                    />
                    {adopted && (
                      <span className="rounded bg-viscum-leaf-soft px-1.5 py-0.5 text-[10px] font-medium text-viscum-leaf-deep">
                        採用
                      </span>
                    )}
                    {tipped && (
                      <span className="rounded bg-viscum-berry/15 px-1.5 py-0.5 text-[10px] font-medium text-viscum-berry-deep">
                        チップ受取
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[14px] font-medium leading-snug text-viscum-ink line-clamp-2">
                    {work.title}
                  </p>
                  <p className="mt-1 text-[11px] text-viscum-muted">
                    シーダー {accountLabelForHandle(work.seeder).line}
                    {commentSubject ? ` · 「${commentSubject}」` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PortfolioWall handle={display} />

      <p className="px-4 py-8 text-center text-sm">
        <Link href="/" className="text-viscum-brand hover:underline">
          TOP
        </Link>
      </p>
      </div>
    </BrowseChrome>
  );
}
