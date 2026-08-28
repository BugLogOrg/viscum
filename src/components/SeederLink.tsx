"use client";

import Link from "next/link";
import { useSeederDisplayLine } from "@/hooks/useSeederDisplayLine";
import { isDemoSeederHandle } from "@/data/suggested-seeders";
import { DemoBadge } from "@/components/DemoBadge";

/**
 * シーダー表示：アカウント名＋@英語ID。
 * 端末プロフィール → API の順で名前を補完する。
 * デモ棚の予約IDには「デモ用」を併記。
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
  const demo = isDemoSeederHandle(h);

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <Link
        href={`/u/${encodeURIComponent(h)}`}
        className={className}
        title="プロフィールを見る"
      >
        {line}
      </Link>
      {demo ? <DemoBadge className="px-1.5 text-[10px]" /> : null}
    </span>
  );
}
