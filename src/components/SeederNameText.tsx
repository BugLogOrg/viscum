"use client";

import { useEffect, useState } from "react";
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
 * シーダー名の表示のみ（リンクなし）。
 * 端末プロフィール → API → シード時スナップショットの順。
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
  const h = handle.replace(/^@/, "").trim();
  const [line, setLine] = useState(() =>
    accountLabelForHandle(h, preferredName).line,
  );

  useEffect(() => {
    const localName = displayAccountName(h, readLocalProfile(h));
    const seedName = preferredName?.trim() || "";
    const liveLocal =
      localName.toLowerCase() !== h.toLowerCase() ? localName : "";
    const start =
      liveLocal ||
      seedName ||
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

  return <>{line}</>;
}
