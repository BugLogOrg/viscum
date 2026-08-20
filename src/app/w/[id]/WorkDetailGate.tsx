"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Work } from "@/data/dummy-works";
import { resolveWorkClient } from "@/lib/local-seeds";
import { WorkDetailBody } from "./WorkDetailBody";

/** サーバで見つからない ID（local_* 等）を端末内シードから解決 */
export function WorkDetailGate({
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
      <div className="max-w-lg px-4 py-10 text-[14px] leading-relaxed text-viscum-muted">
        <p>この作品は見つかりませんでした。</p>
        <p className="mt-2">
          端末内シードの場合は、シードしたブラウザで開いてください。
        </p>
        <p className="mt-4">
          <Link href="/" className="text-viscum-brand underline">
            TOPへ
          </Link>
        </p>
      </div>
    );
  }

  return <WorkDetailBody work={work} />;
}
