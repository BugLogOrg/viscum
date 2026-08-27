import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { comments, payments, users } from "@/db/schema";
import {
  getMentorFacts,
  getWork,
  getWorksMentoredBy,
  type MentorFacts,
  type MentorParticipation,
  type Work,
} from "@/data/dummy-works";
import { mentorPayFactsFromDb } from "@/db/payment-facts";

function stubWork(workId: string): Work {
  return {
    id: workId,
    title: workId,
    tagline: "",
    seeder: "unknown",
    tags: [],
    status: "open",
    hoursAgo: 0,
    description: "",
    externalUrl: "",
    thumbTone: "leaf",
    comments: [],
  };
}

function resolveWork(workId: string): Work {
  return getWork(workId) ?? stubWork(workId);
}

function preferWork(a: Work, b: Work): Work {
  // タイトルが ID のままより、実タイトルがある方を優先
  if (a.title !== a.id && b.title === b.id) return a;
  if (b.title !== b.id && a.title === a.id) return b;
  return a;
}

/** Neon 上のメンター参加・採用・受取（ハンドル単位） */
export async function mentorPortfolioFromDb(handle: string): Promise<{
  facts: Omit<MentorFacts, "handle"> | null;
  participations: MentorParticipation[];
}> {
  const h = handle.replace(/^@/, "").trim();
  const db = getDb();
  if (!db || !h) return { facts: null, participations: [] };

  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.handle, h))
    .limit(1);
  const user = userRows[0];
  if (!user) return { facts: null, participations: [] };

  const commentRows = await db
    .select({
      workId: comments.workId,
      subject: comments.subject,
      adoptedAt: comments.adoptedAt,
      createdAt: comments.createdAt,
      commentId: comments.id,
    })
    .from(comments)
    .where(eq(comments.authorId, user.id))
    .orderBy(desc(comments.createdAt))
    .limit(200);

  const tippedByComment = new Map<string, number>();
  const paidRows = await db
    .select({
      commentId: payments.commentId,
      amountYen: payments.amountYen,
    })
    .from(payments)
    .where(
      and(
        eq(payments.toUserId, user.id),
        eq(payments.checkoutStatus, "paid"),
        isNotNull(payments.commentId),
      ),
    );
  for (const p of paidRows) {
    if (p.commentId) tippedByComment.set(p.commentId, p.amountYen);
  }

  const byWork = new Map<string, MentorParticipation>();
  let adoptedCount = 0;
  for (const row of commentRows) {
    const tippedYen = tippedByComment.get(row.commentId);
    const adopted = Boolean(row.adoptedAt) || tippedYen != null;
    if (row.adoptedAt) adoptedCount += 1;
    const prev = byWork.get(row.workId);
    if (!prev) {
      byWork.set(row.workId, {
        work: resolveWork(row.workId),
        adopted,
        tipped: tippedYen != null,
        commentSubject: row.subject,
      });
    } else {
      byWork.set(row.workId, {
        ...prev,
        adopted: prev.adopted || adopted,
        tipped: prev.tipped || tippedYen != null,
        commentSubject: prev.commentSubject ?? row.subject,
      });
    }
  }

  const pay = await mentorPayFactsFromDb(user.id);

  return {
    facts: {
      participatedCount: byWork.size,
      adoptedCount,
      tipsReceivedCount: pay.receivedCount,
      tipsReceivedYenTotal: pay.receivedYenTotal,
    },
    participations: [...byWork.values()],
  };
}

function mergeFacts(
  a: Omit<MentorFacts, "handle">,
  b: Omit<MentorFacts, "handle">,
): Omit<MentorFacts, "handle"> {
  return {
    participatedCount: Math.max(a.participatedCount, b.participatedCount),
    adoptedCount: Math.max(a.adoptedCount, b.adoptedCount),
    tipsReceivedCount: Math.max(a.tipsReceivedCount, b.tipsReceivedCount),
    tipsReceivedYenTotal: Math.max(
      a.tipsReceivedYenTotal,
      b.tipsReceivedYenTotal,
    ),
  };
}

/**
 * 公開PF用。デモ表＋Neon 実コメント／受取をマージ。
 */
export async function mentorPortfolioForHandle(handle: string): Promise<{
  facts: MentorFacts;
  participations: MentorParticipation[];
}> {
  const h = handle.replace(/^@/, "").trim();
  const demoFacts = getMentorFacts(h);
  const demoList = getWorksMentoredBy(h);
  const fromDb = await mentorPortfolioFromDb(h);

  const factsBase: MentorFacts = fromDb.facts
    ? { handle: h, ...mergeFacts(demoFacts, fromDb.facts) }
    : demoFacts;

  const byId = new Map<string, MentorParticipation>();
  for (const p of demoList) byId.set(p.work.id, p);
  for (const p of fromDb.participations) {
    const prev = byId.get(p.work.id);
    if (!prev) {
      byId.set(p.work.id, p);
    } else {
      byId.set(p.work.id, {
        work: preferWork(prev.work, p.work),
        adopted: prev.adopted || p.adopted,
        tipped: prev.tipped || p.tipped,
        commentSubject: prev.commentSubject ?? p.commentSubject,
      });
    }
  }

  const participations = [...byId.values()];
  return {
    facts: {
      ...factsBase,
      participatedCount: Math.max(
        factsBase.participatedCount,
        participations.length,
      ),
    },
    participations,
  };
}
