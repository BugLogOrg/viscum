import { desc, eq, inArray, or } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { requestDms, users } from "@/db/schema";
import type { RequestDm } from "@/lib/local-request-dms";
import { requestDmToClient } from "@/lib/request-dm-serialize";

/** 自分関連の直依頼一覧（messages / thumb 列は読まない） */
export async function listMyRequestDms(userId: string): Promise<{
  requests: RequestDm[];
  persisted: boolean;
}> {
  if (!userId || !hasDatabase()) {
    return { requests: [], persisted: false };
  }
  const db = getDb();
  if (!db) {
    return { requests: [], persisted: false };
  }

  const rows = await db
    .select({
      id: requestDms.id,
      workId: requestDms.workId,
      workTitle: requestDms.workTitle,
      workExternalUrl: requestDms.workExternalUrl,
      workSummary: requestDms.workSummary,
      fromUserId: requestDms.fromUserId,
      toUserId: requestDms.toUserId,
      inviteId: requestDms.inviteId,
      amountYen: requestDms.amountYen,
      pitch: requestDms.pitch,
      status: requestDms.status,
      createdAt: requestDms.createdAt,
      updatedAt: requestDms.updatedAt,
    })
    .from(requestDms)
    .where(
      or(eq(requestDms.fromUserId, userId), eq(requestDms.toUserId, userId)),
    )
    .orderBy(desc(requestDms.createdAt))
    .limit(40);

  const userIds = [
    ...new Set(
      rows.flatMap((r) =>
        [r.fromUserId, r.toUserId].filter((id): id is string => Boolean(id)),
      ),
    ),
  ];
  const userRows =
    userIds.length === 0
      ? []
      : await db
          .select({
            id: users.id,
            handle: users.handle,
            name: users.name,
          })
          .from(users)
          .where(inArray(users.id, userIds));
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  const requests = rows.map((r) => {
    const from = userMap.get(r.fromUserId);
    const to = r.toUserId ? userMap.get(r.toUserId) : null;
    const slim = {
      ...r,
      workThumbUrl: null as string | null,
      messages: [] as typeof requestDms.$inferSelect.messages,
    };
    return requestDmToClient(
      slim as typeof requestDms.$inferSelect,
      { handle: from?.handle ?? null, name: from?.name ?? null },
      to
        ? { handle: to.handle ?? null, name: to.name ?? null }
        : null,
      { lean: true },
    );
  });

  return { requests, persisted: true };
}
