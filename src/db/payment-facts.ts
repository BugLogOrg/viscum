import { and, count, eq, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { payments } from "@/db/schema";

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
