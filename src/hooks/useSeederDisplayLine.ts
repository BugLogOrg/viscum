"use client";

import { useCallback, useEffect, useState } from "react";
import {
  accountLabelForHandle,
  getDemoSeederProfile,
  isReservedDemoHandle,
} from "@/data/suggested-seeders";
import {
  displayAccountName,
  fetchRemoteProfile,
  peekCachedAccountName,
  readLocalProfile,
} from "@/lib/local-profile";

export function formatSeederLine(handle: string, accountName: string): string {
  const h = handle.replace(/^@/, "").trim();
  const name = accountName.trim() || h;
  return name.toLowerCase() === h.toLowerCase() ? `@${h}` : `${name} @${h}`;
}

function resolveAccountName(handle: string, preferredName?: string): string {
  const h = handle.replace(/^@/, "").trim();
  const demo = getDemoSeederProfile(h);
  if (demo) return demo.displayName;

  const cached = peekCachedAccountName(h)?.trim() || "";
  const localName = displayAccountName(h, readLocalProfile(h));
  const liveLocal =
    localName.toLowerCase() !== h.toLowerCase() ? localName : "";
  const seedName = preferredName?.trim() || "";
  return (
    cached ||
    liveLocal ||
    seedName ||
    accountLabelForHandle(h).accountName
  );
}

/**
 * シーダー表示名。メモリキャッシュ → 端末 → API → シード時スナップショット。
 * 予約デモIDはデモ名固定（端末の実名で上書きしない）。
 */
export function useSeederDisplayLine(
  handle: string,
  preferredName?: string,
): string {
  const h = handle.replace(/^@/, "").trim();
  const [line, setLine] = useState(() =>
    formatSeederLine(h, resolveAccountName(h, preferredName)),
  );

  const refresh = useCallback(() => {
    setLine(formatSeederLine(h, resolveAccountName(h, preferredName)));
  }, [h, preferredName]);

  useEffect(() => {
    refresh();

    if (isReservedDemoHandle(h)) return;

    let cancelled = false;
    void fetchRemoteProfile(h).then((remote) => {
      if (cancelled) return;
      const remoteName = remote?.accountName?.trim();
      if (!remoteName) return;
      setLine(formatSeederLine(h, remoteName));
    });

    const onProfile = () => refresh();
    window.addEventListener("viscum-profile-updated", onProfile);
    return () => {
      cancelled = true;
      window.removeEventListener("viscum-profile-updated", onProfile);
    };
  }, [h, preferredName, refresh]);

  return line;
}
