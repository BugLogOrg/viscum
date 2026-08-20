"use client";

import { useEffect, useState } from "react";
import {
  isLocalSeedListed,
  readLocalSeeds,
} from "@/lib/local-seeds";

/** local_* の公開／未公開を詳細に明示 */
export function LocalSeedVisibilityNote({ workId }: { workId: string }) {
  const [listed, setListed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!workId.startsWith("local_")) {
      setListed(null);
      return;
    }
    const seed = readLocalSeeds().find((s) => s.id === workId);
    setListed(seed ? isLocalSeedListed(seed) : false);
  }, [workId]);

  if (!workId.startsWith("local_") || listed == null) return null;

  return (
    <p className="text-[11px] leading-relaxed text-viscum-muted">
      {listed ? (
        <>
          トップの棚に<strong className="font-medium text-viscum-ink">公開中</strong>
          です（この端末のデモ保存）。他の端末では見えない場合があります。
        </>
      ) : (
        <>
          <strong className="font-medium text-viscum-berry-deep">未公開</strong>
          です。トップの「すべて」には出ていません。「全体に告知する（公開）」で棚に出せます。直依頼は未公開のまま送れます。
        </>
      )}
    </p>
  );
}
