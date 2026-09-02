import type { RequestDm } from "@/lib/local-request-dms";

/** ヘッダDMドット：自分のアクション待ち件数 */
export function countDmAttention(
  requests: RequestDm[],
  handle: string,
): number {
  const me = handle.replace(/^@/, "").toLowerCase();
  return requests.filter((r) => {
    const to = r.toHandle.replace(/^@/, "").toLowerCase();
    const from = r.fromHandle.replace(/^@/, "").toLowerCase();
    // 受け手：未返事
    if (r.status === "pending" && to === me) return true;
    // 依頼主：提出済み・承認待ち
    if (r.status === "pay_waiting" && from === me) return true;
    return false;
  }).length;
}
