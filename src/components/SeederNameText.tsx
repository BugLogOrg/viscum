"use client";

import { useSeederDisplayLine } from "@/hooks/useSeederDisplayLine";
import { isDemoSeederHandle } from "@/data/suggested-seeders";
import { DemoBadge } from "@/components/DemoBadge";

/**
 * シーダー名の表示のみ（リンクなし）。
 * フィード内の親 Link とネストしないための分離。
 * デモ棚の予約IDには「デモ用」を併記。
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
      <DemoBadge />
    </span>
  );
}
