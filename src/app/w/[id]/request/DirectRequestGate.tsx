"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Work } from "@/data/dummy-works";
import { resolveWorkClient } from "@/lib/local-seeds";
import { DirectRequestForm } from "./DirectRequestForm";

/** ダミー作品＋端末内シードの両方を直依頼に載せる */
export function DirectRequestGate({
  workId,
  initialWork,
}: {
  workId: string;
  initialWork: Work | null;
}) {
  const [work, setWork] = useState<Work | null>(initialWork);

  useEffect(() => {
    if (initialWork) {
      setWork(initialWork);
      return;
    }
    setWork(resolveWorkClient(workId));
  }, [workId, initialWork]);

  if (!work) {
    return (
      <div className="rounded-lg border border-viscum-line bg-white/60 px-4 py-5 text-[13px] leading-relaxed text-viscum-muted">
        <p>この作品は見つかりませんでした。</p>
        <p className="mt-2">
          シード直後なら、同じブラウザで開き直すか、もう一度シードしてください（デモは端末内に保存します）。
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
