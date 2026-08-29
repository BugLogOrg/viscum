"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkFeedRow } from "@/components/WorkFeedRow";
import {
  PortfolioPagerBar,
  PORTFOLIO_PAGE_SIZE,
  usePortfolioPage,
} from "@/components/PortfolioPager";
import {
  formatYen,
  type MentorFacts,
  type MentorParticipation,
} from "@/data/dummy-works";
import { listAllLocalCommentBuckets } from "@/lib/local-comments";
import { resolveWorkClient } from "@/lib/local-seeds";

function norm(h: string) {
  return h.replace(/^@/, "").trim().toLowerCase();
}

function mergeParticipations(
  initial: MentorParticipation[],
  local: MentorParticipation[],
): MentorParticipation[] {
  const byId = new Map<string, MentorParticipation>();
  for (const p of initial) byId.set(p.work.id, p);
  for (const p of local) {
    const prev = byId.get(p.work.id);
    if (!prev) {
      byId.set(p.work.id, p);
      continue;
    }
    byId.set(p.work.id, {
      work:
        prev.work.title === prev.work.id && p.work.title !== p.work.id
          ? p.work
          : prev.work,
      adopted: prev.adopted || p.adopted,
      tipped: prev.tipped || p.tipped,
      commentSubject: prev.commentSubject ?? p.commentSubject,
      commentId: prev.commentId ?? p.commentId,
    });
  }
  return [...byId.values()];
}

function loadLocalForHandle(handle: string): MentorParticipation[] {
  const key = norm(handle);
  const byId = new Map<string, MentorParticipation>();
  for (const { workId, comments } of listAllLocalCommentBuckets()) {
    const mine = comments.filter((c) => norm(c.author) === key);
    if (mine.length === 0) continue;
    const work = resolveWorkClient(workId);
    if (!work) continue;
    byId.set(workId, {
      work,
      adopted: mine.some((c) => Boolean(c.adopted)),
      tipped: mine.some((c) => Boolean(c.tipped)),
      commentSubject: mine[0]?.subject,
      commentId: mine[0]?.id,
    });
  }
  return [...byId.values()];
}

function useMentorParticipations(
  handle: string,
  initialParticipations: MentorParticipation[],
) {
  const [localParts, setLocalParts] = useState<MentorParticipation[]>([]);

  useEffect(() => {
    setLocalParts(loadLocalForHandle(handle));
    const onStorage = (e: StorageEvent) => {
      if (e.key && !e.key.startsWith("viscum_local_comments_v1_")) return;
      setLocalParts(loadLocalForHandle(handle));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [handle]);

  return useMemo(
    () => mergeParticipations(initialParticipations, localParts),
    [initialParticipations, localParts],
  );
}

type CardProps = {
  handle: string;
  initialFacts: MentorFacts;
  initialParticipations: MentorParticipation[];
};

/** メンター実績カード（コメント時点で参加に計上） */
export function MentorFactsCard({
  handle,
  initialFacts,
  initialParticipations,
}: CardProps) {
  const participations = useMentorParticipations(
    handle,
    initialParticipations,
  );

  const facts: MentorFacts = {
    handle: initialFacts.handle,
    participatedCount: Math.max(
      initialFacts.participatedCount,
      participations.length,
    ),
    adoptedCount: Math.max(
      initialFacts.adoptedCount,
      participations.filter((p) => p.adopted).length,
    ),
    tipsReceivedCount: Math.max(
      initialFacts.tipsReceivedCount,
      participations.filter((p) => p.tipped).length,
    ),
    tipsReceivedYenTotal: initialFacts.tipsReceivedYenTotal,
  };

  const hasMentorHistory =
    facts.participatedCount > 0 ||
    facts.adoptedCount > 0 ||
    facts.tipsReceivedCount > 0 ||
    participations.length > 0;

  return (
    <div className="rounded-lg border border-viscum-line bg-viscum-paper-2/60 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-medium text-viscum-ink">メンター実績</p>
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
      <p className="mt-1 text-[10px] leading-snug text-viscum-muted">
        作品に反応する側をメンターと呼びます（書く側の事実）
      </p>
      <dl className="mt-2 space-y-0.5 text-[14px] text-viscum-ink">
        <div>
          <dt className="inline text-viscum-muted">参加作品：</dt>
          <dd className="inline tabular-nums">
            {Math.max(facts.participatedCount, participations.length)}件
          </dd>
        </div>
        <div>
          <dt className="inline text-viscum-muted">選出された：</dt>
          <dd className="inline tabular-nums">{facts.adoptedCount}件</dd>
        </div>
        <div>
          <dt className="inline text-viscum-muted">褒賞受取：</dt>
          <dd className="inline tabular-nums">{facts.tipsReceivedCount}件</dd>
        </div>
        <div>
          <dt className="inline text-viscum-muted">累計受取：</dt>
          <dd className="inline tabular-nums text-viscum-ink">
            {formatYen(facts.tipsReceivedYenTotal)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

type ListProps = {
  handle: string;
  initialParticipations: MentorParticipation[];
};

/** メンターとして参加した作品棚（シード棚の下・TOP同様2列・10件） */
export function MentoredWorksList({
  handle,
  initialParticipations,
}: ListProps) {
  const participations = useMentorParticipations(
    handle,
    initialParticipations,
  );
  const { page, pageCount, pageItems, goToPage } = usePortfolioPage(
    participations,
    PORTFOLIO_PAGE_SIZE,
  );

  const at = handle.replace(/^@/, "").trim() || handle;

  return (
    <section
      className="border-b border-viscum-line"
      aria-label={`${at}が参加した作品`}
    >
      <h2 className="px-4 pt-5 text-[18px] font-bold leading-tight tracking-wide text-viscum-ink">
        <span className="text-viscum-brand">@{at}</span>
        {" "}
        が参加した作品
        <span className="ml-1.5 text-[13px] font-medium tabular-nums text-viscum-muted">
          · {participations.length}件
        </span>
      </h2>
      <p className="px-4 pt-1.5 text-[12px] leading-snug text-viscum-muted">
        コメントして参加した棚です（選出・決済前も含む）。選出・褒賞はバッジで事実表示します。
      </p>
      {participations.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-viscum-muted">
          まだ参加した作品はありません。
        </p>
      ) : (
        <>
          <div className="mt-2 lg:grid lg:grid-cols-2 lg:divide-x lg:divide-viscum-line">
            {pageItems.map(
              ({ work, adopted, tipped, commentSubject, commentId }) => {
              const workHref = commentId
                ? `/w/${work.id}?c=${encodeURIComponent(commentId)}`
                : `/w/${work.id}`;
              return (
              <div key={work.id} className="relative min-w-0">
                {(adopted || tipped || commentSubject) && (
                  <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                    {adopted ? (
                      <span className="rounded bg-viscum-leaf-soft px-1.5 py-0.5 text-[10px] font-medium text-viscum-leaf-deep">
                        選出
                      </span>
                    ) : null}
                    {tipped ? (
                      <span className="rounded bg-viscum-berry/15 px-1.5 py-0.5 text-[10px] font-medium text-viscum-berry-deep">
                        褒賞受取
                      </span>
                    ) : null}
                    {commentSubject ? (
                      <span className="truncate text-[11px] text-viscum-muted">
                        「{commentSubject}」
                      </span>
                    ) : null}
                  </div>
                )}
                <WorkFeedRow
                  work={work}
                  href={workHref}
                  className="lg:border-viscum-line"
                />
              </div>
              );
            })}
          </div>
          <PortfolioPagerBar
            page={page}
            pageCount={pageCount}
            onPrev={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
          />
        </>
      )}
    </section>
  );
}
