"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { accountLabelForHandle } from "@/data/suggested-seeders";
import {
  displayAccountName,
  fetchRemoteProfile,
  readLocalProfile,
} from "@/lib/local-profile";

function formatLine(handle: string, accountName: string): string {
  const h = handle.replace(/^@/, "").trim();
  const name = accountName.trim() || h;
  return name.toLowerCase() === h.toLowerCase() ? `@${h}` : `${name} @${h}`;
}

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
  const initial = (() => {
    if (preferredName?.trim()) return formatLine(h, preferredName);
    return accountLabelForHandle(h).line;
  })();
  const [line, setLine] = useState(initial);

  useEffect(() => {
    const localName = displayAccountName(h, readLocalProfile(h));
    const seedName = preferredName?.trim();
    const start =
      seedName ||
      (localName.toLowerCase() !== h.toLowerCase() ? localName : "") ||
      accountLabelForHandle(h).accountName;
    setLine(formatLine(h, start));

    let cancelled = false;
    void fetchRemoteProfile(h).then((remote) => {
      if (cancelled) return;
      const remoteName = remote?.accountName?.trim();
      if (remoteName) setLine(formatLine(h, remoteName));
    });
    return () => {
      cancelled = true;
    };
  }, [h, preferredName]);

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
