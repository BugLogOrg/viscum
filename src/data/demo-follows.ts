/**
 * @deprecated 固定デモフォローは廃止。実フォローは `@/lib/local-follows`。
 * 互換のため空のまま残置（参照が残っていても誤爆しない）。
 */
export const DEMO_FOLLOWING = new Set<string>();

export function isDemoFollowing(_handle: string): boolean {
  return false;
}
