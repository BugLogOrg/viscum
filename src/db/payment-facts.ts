import { and, count, eq, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { payments, users } from "@/db/schema";
import {
  getSeederPayFacts,
  type SeederPayFacts,
} from "@/data/dummy-works";

/** 作品バッジ用: Checkout 完了件数（paymentsDone 相当） */
export async function countPaidPaymentsForWork(
  workId: string,
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: count() })
    .from(payments)
    .where(
      and(
        eq(payments.workId, workId),
        eq(payments.checkoutStatus, "paid"),
      ),
    );
  return Number(rows[0]?.n ?? 0);
}

/** 層B: シーダーの支払い完了集計 */
export async function seederPayFactsFromDb(userId: string): Promise<{
  paidCount: number;
  paidYenTotal: number;
}> {
  const db = getDb();
  if (!db) return { paidCount: 0, paidYenTotal: 0 };
  const rows = await db
    .select({
      n: count(),
      yen: sum(payments.amountYen),
    })
    .from(payments)
    .where(
      and(
        eq(payments.fromUserId, userId),
        eq(payments.checkoutStatus, "paid"),
      ),
    );
  return {
    paidCount: Number(rows[0]?.n ?? 0),
    paidYenTotal: Number(rows[0]?.yen ?? 0),
  };
}

/** 層B: メンターの受取事実（Checkout 完了＝払われた側） */
export async function mentorPayFactsFromDb(userId: string): Promise<{
  receivedCount: number;
  receivedYenTotal: number;
}> {
  const db = getDb();
  if (!db) return { receivedCount: 0, receivedYenTotal: 0 };
  const rows = await db
    .select({
      n: count(),
      yen: sum(payments.amountYen),
    })
    .from(payments)
    .where(
      and(
        eq(payments.toUserId, userId),
        eq(payments.checkoutStatus, "paid"),
      ),
    );
  return {
    receivedCount: Number(rows[0]?.n ?? 0),
    receivedYenTotal: Number(rows[0]?.yen ?? 0),
  };
}

/**
 * ハンドルから層B。DBに実決済があればそれを優先、なければデモ表。
 */
export async function seederPayFactsForHandle(
  handle: string,
): Promise<SeederPayFacts> {
  const h = handle.replace(/^@/, "").trim();
  const dummy = getSeederPayFacts(h);
  const db = getDb();
  if (!db || !h) return dummy;

  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.handle, h))
    .limit(1);
  const user = userRows[0];
  if (!user) return dummy;

  const facts = await seederPayFactsFromDb(user.id);
  if (facts.paidCount > 0) {
    return {
      handle: h,
      paymentsCount: facts.paidCount,
      paidYenTotal: facts.paidYenTotal,
    };
  }
  return dummy;
}
