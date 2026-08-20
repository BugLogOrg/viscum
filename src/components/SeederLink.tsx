"use client";

import Link from "next/link";
import { useSeederDisplayLine } from "@/hooks/useSeederDisplayLine";

/**
 * シーダー表示：アカウント名＋@英語ID。
 * 端末プロフィール → API の順で名前を補完する。
 */
export function SeederLink({
  handle,
  preferredName,
  className = "font-medium text-viscum-trunk underline decoration-viscum-line underline-offset-2 hover:text-viscum-brand hover:decoration-viscum-brand",
}: {
  handle: string;
  /** シード保存時のアカウント名など */
  preferredName?: string;
  className?: string;
}) {
  const h = handle.replace(/^@/, "").trim();
  const line = useSeederDisplayLine(h, preferredName);

  return (
    <Link
      href={`/u/${encodeURIComponent(h)}`}
      className={className}
      title="プロフィールを見る"
    >
      {line}
    </Link>
  );
}
