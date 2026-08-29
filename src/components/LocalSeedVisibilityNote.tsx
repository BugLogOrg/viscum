"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  isClientSeedId,
  isDirectRequestLane,
  isLocalSeedListed,
  readLocalSeeds,
} from "@/lib/local-seeds";

/** 端末内シードの公開／未公開／直依頼レーンを詳細に明示 */
export function LocalSeedVisibilityNote({ workId }: { workId: string }) {
  const [mode, setMode] = useState<"listed" | "draft" | "direct" | null>(null);

  useEffect(() => {
    if (!isClientSeedId(workId)) {
      setMode(null);
      return;
    }
    const seed = readLocalSeeds().find((s) => s.id === workId);
    if (!seed) {
      setMode(null);
      return;
    }
    if (isDirectRequestLane(seed)) setMode("direct");
    else setMode(isLocalSeedListed(seed) ? "listed" : "draft");
  }, [workId]);

  if (!isClientSeedId(workId) || mode == null) return null;

  if (mode === "direct") {
    return (
      <p className="text-[11px] leading-relaxed text-viscum-muted">
        <strong className="font-medium text-viscum-leaf-deep">直依頼用メモ</strong>
        です（別ID・棚には出ません）。
        <Link href={`/w/${encodeURIComponent(workId)}/request`} className="ml-1 underline">
          直依頼へ
        </Link>
      </p>
    );
  }

  return (
    <p className="text-[11px] leading-relaxed text-viscum-muted">
      {mode === "listed" ? (
        <>
          トップの棚に<strong className="font-medium text-viscum-ink">公開中</strong>
          です（この端末のデモ保存）。他の端末では見えない場合があります。
        </>
      ) : (
        <>
          <strong className="font-medium text-viscum-berry-deep">未公開</strong>
          （この端末のデモ保存）。指名依頼は{" "}
          <Link href="/new/request" className="underline">
            直依頼レーン
          </Link>
          から別IDで。
        </>
      )}
    </p>
  );
}
