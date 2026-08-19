/** デモ用フォロー中シーダー（本番は購読グラフ） */
export const DEMO_FOLLOWING = new Set([
  "mdb",
  "ayu",
  "ken",
  "sana",
  "neo",
]);

export function isDemoFollowing(handle: string): boolean {
  return DEMO_FOLLOWING.has(handle.toLowerCase());
}
