import type { RequestDm, RequestDmStatus } from "@/lib/local-request-dms";
import type { requestDms } from "@/db/schema";

type Row = typeof requestDms.$inferSelect;

/** data URL は数百KB〜になり画面遷移を殺すので API では返さない／保存しない */
export function sanitizeWorkThumbUrl(
  url: string | null | undefined,
): string | undefined {
  const t = url?.trim();
  if (!t) return undefined;
  if (t.startsWith("data:")) return undefined;
  if (t.length > 2000) return undefined;
  return t;
}

export function requestDmToClient(
  row: Row,
  from: { handle: string | null; name: string | null },
  to: { handle: string | null; name: string | null } | null,
  opts?: { lean?: boolean },
): RequestDm {
  const lean = Boolean(opts?.lean);
  const summary = row.workSummary?.trim() || undefined;
  const outboundUnassigned = !row.toUserId;
  const toHandle = outboundUnassigned
    ? ""
    : (to?.handle ?? "").replace(/^@/, "") || "unknown";
  return {
    id: row.id,
    workId: row.workId,
    workTitle: row.workTitle,
    workExternalUrl: row.workExternalUrl?.trim() || undefined,
    workThumbUrl: lean
      ? undefined
      : sanitizeWorkThumbUrl(row.workThumbUrl),
    workSummary: lean
      ? summary
        ? summary.slice(0, 160) + (summary.length > 160 ? "…" : "")
        : undefined
      : summary,
    fromHandle: (from.handle ?? "").replace(/^@/, "") || "unknown",
    fromAccountName: from.name?.trim() || undefined,
    toHandle,
    inviteId: row.inviteId?.trim() || undefined,
    outboundUnassigned,
    amountYen: row.amountYen,
    pitch: row.pitch,
    status: row.status as RequestDmStatus,
    createdAt: row.createdAt.toISOString(),
    messages: lean
      ? []
      : Array.isArray(row.messages)
        ? row.messages
        : [],
  };
}
