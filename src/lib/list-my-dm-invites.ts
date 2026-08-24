import { desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { dmInvites } from "@/db/schema";

export type MyDmInvite = {
  id: string;
  workId: string;
  workTitle: string;
  workExternalUrl?: string;
  amountYen: number;
  pitch?: string;
  createdAt: string;
  path: string;
};

/** 自分が発行した外向け招待（返事前でも管理できる） */
export async function listMyDmInvites(userId: string): Promise<{
  invites: MyDmInvite[];
  persisted: boolean;
}> {
  if (!userId || !hasDatabase()) {
    return { invites: [], persisted: false };
  }
  const db = getDb();
  if (!db) {
    return { invites: [], persisted: false };
  }

  const rows = await db
    .select({
      id: dmInvites.id,
      workId: dmInvites.workId,
      workTitle: dmInvites.workTitle,
      workExternalUrl: dmInvites.workExternalUrl,
      amountYen: dmInvites.amountYen,
      pitch: dmInvites.pitch,
      createdAt: dmInvites.createdAt,
    })
    .from(dmInvites)
    .where(eq(dmInvites.fromUserId, userId))
    .orderBy(desc(dmInvites.createdAt))
    .limit(40);

  return {
    invites: rows.map((r) => ({
      id: r.id,
      workId: r.workId,
      workTitle: r.workTitle,
      workExternalUrl: r.workExternalUrl?.trim() || undefined,
      amountYen: r.amountYen,
      pitch: r.pitch?.trim() || undefined,
      createdAt: r.createdAt.toISOString(),
      path: `/dm/i/${r.id}`,
    })),
    persisted: true,
  };
}
