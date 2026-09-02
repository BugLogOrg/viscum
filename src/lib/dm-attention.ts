import type { RequestDm } from "@/lib/local-request-dms";

function norm(handle: string) {
  return handle.replace(/^@/, "").toLowerCase();
}

/** 自分のアクション待ち（返事／承認） */
export function needsDmAttention(r: RequestDm, handle: string): boolean {
  const me = norm(handle);
  const to = norm(r.toHandle || "");
  const from = norm(r.fromHandle || "");
  if (r.status === "pending" && to === me) return true;
  if (r.status === "pay_waiting" && from === me) return true;
  return false;
}

/** ヘッダDMドット：自分のアクション待ち件数 */
export function countDmAttention(
  requests: RequestDm[],
  handle: string,
): number {
  return requests.filter((r) => needsDmAttention(r, handle)).length;
}

function activityAt(r: RequestDm) {
  return r.updatedAt || r.createdAt;
}

/** 未読更新：最終更新が最終閲覧より新しい（アクション待ちは常に強調） */
export function isDmRowAlert(
  r: RequestDm,
  handle: string,
  lastSeenAt: string | null | undefined,
): boolean {
  if (needsDmAttention(r, handle)) return true;
  if (!lastSeenAt) return false;
  return activityAt(r) > lastSeenAt;
}
