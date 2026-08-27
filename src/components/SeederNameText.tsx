"use client";

import { useSeederDisplayLine } from "@/hooks/useSeederDisplayLine";
import { isDemoSeederHandle } from "@/data/suggested-seeders";

/**
 * シーダー名の表示のみ（リンクなし）。
 * フィード内の親 Link とネストしないための分離。
 * デモ棚の予約IDには「デモ用アカウント」を併記。
 */
export function SeederNameText({
  handle,
  preferredName,
}: {
  handle: string;
  /** シード保存時の名前。ライブ名が無ければフォールバック */
  preferredName?: string;
}) {
  const line = useSeederDisplayLine(handle, preferredName);
  const demo = isDemoSeederHandle(handle);
  if (!demo) return <>{line}</>;
  return (
    <span className="inline-flex max-w-full items-baseline gap-1">
      <span className="truncate">{line}</span>
      <span className="shrink-0 rounded bg-viscum-paper-2 px-1 py-0.5 text-[9px] font-medium text-viscum-muted">
        デモ用
      </span>
    </span>
  );
}
