"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Work } from "@/data/dummy-works";
import {
  isClientSeedId,
  isDirectRequestLane,
  readLocalSeeds,
  resolveWorkClient,
} from "@/lib/local-seeds";
import { DirectRequestForm } from "./DirectRequestForm";

/**
 * 直依頼は非公開レーンのみ（ADR-038）。
 * 棚シード（local_）からは張れない。デモ作品IDはLP用に許可。
 */
export function DirectRequestGate({
  workId,
  initialWork,
}: {
  workId: string;
  initialWork: Work | null;
}) {
  const [work, setWork] = useState<Work | null>(initialWork);
  const [blockedShelf, setBlockedShelf] = useState(false);

  useEffect(() => {
    if (isClientSeedId(workId)) {
      const seed = readLocalSeeds().find((s) => s.id === workId);
      if (seed && !isDirectRequestLane(seed)) {
        setBlockedShelf(true);
        setWork(null);
        return;
      }
      // drq_ など端末内直依頼メモ
      setBlockedShelf(false);
      setWork(seed ? resolveWorkClient(workId) : null);
      return;
    }
    setBlockedShelf(false);
    if (initialWork) {
      setWork(initialWork);
      return;
    }
    setWork(resolveWorkClient(workId));
  }, [workId, initialWork]);

  if (blockedShelf) {
    return (
      <div className="rounded-lg border border-viscum-berry/30 bg-viscum-berry/5 px-4 py-5 text-[13px] leading-relaxed text-viscum-ink">
        <p className="font-medium text-viscum-berry-deep">
          棚シードからは直依頼できません
        </p>
        <p className="mt-2 text-viscum-muted">
          公開した作品に特定の人を巻き込むときは、詳細の告知文をコピーしてDM／Xに貼るのが本線です。
          有償の指名オファーは、非公開の直依頼レーンで別IDを作ります。
        </p>
        <p className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href={`/w/${encodeURIComponent(workId)}`}
            className="text-viscum-brand underline"
          >
            作品ページへ（告知文あり）
          </Link>
          <Link
            href="/new/request"
            className="inline-flex justify-center rounded-md bg-viscum-berry px-3 py-2 text-sm font-medium text-white hover:bg-viscum-berry-deep"
          >
            直依頼レーン（非公開）へ
          </Link>
        </p>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="rounded-lg border border-viscum-line bg-white/60 px-4 py-5 text-[13px] leading-relaxed text-viscum-muted">
        <p>この作品は見つかりませんでした。</p>
        <p className="mt-2">
          直依頼は非公開レーンから作成してください（同じブラウザのメモが必要です）。
        </p>
        <p className="mt-4">
          <Link href="/new/request" className="text-viscum-brand underline">
            直依頼レーンへ
          </Link>
        </p>
      </div>
    );
  }

  return <DirectRequestForm work={work} />;
}
