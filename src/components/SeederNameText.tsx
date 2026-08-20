"use client";

import { useSeederDisplayLine } from "@/hooks/useSeederDisplayLine";

/**
 * シーダー名の表示のみ（リンクなし）。
 * フィード内の親 Link とネストしないための分離。
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
  return <>{line}</>;
}
