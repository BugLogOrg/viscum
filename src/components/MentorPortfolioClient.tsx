"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatYen,
  planBadgeLabel,
  type MentorFacts,
  type MentorParticipation,
} from "@/data/dummy-works";
import { listAllLocalCommentBuckets } from "@/lib/local-comments";
import { resolveWorkClient } from "@/lib/local-seeds";
import { accountLabelForHandle } from "@/data/suggested-seeders";

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
      <p className="mt-1 text-[10px] text-viscum-muted">書く側の事実</p>
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

/** メンターとして参加した作品棚 */
export function MentoredWorksList({
  handle,
  initialParticipations,
}: ListProps) {
  const participations = useMentorParticipations(
    handle,
    initialParticipations,
  );

  return (
    <section>
      <p className="px-4 pt-4 text-[20px] font-bold text-viscum-ink">
        メンターとして参加した作品 · {participations.length}件
      </p>
      <p className="px-4 pt-1 text-[11px] text-viscum-muted">
        コメントした棚です（選出・決済前も含む）。選出・褒賞はバッジで事実表示します。
      </p>
      {participations.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-viscum-muted">
          まだ参加した作品はありません。
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-viscum-line border-t border-viscum-line">
          {participations.map(({ work, adopted, tipped, commentSubject }) => (
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
                      選出
                    </span>
                  )}
                  {tipped && (
                    <span className="rounded bg-viscum-berry/15 px-1.5 py-0.5 text-[10px] font-medium text-viscum-berry-deep">
                      褒賞受取
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
  );
}
