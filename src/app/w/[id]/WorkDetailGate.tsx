"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Work } from "@/data/dummy-works";
import { isNeonWorkId } from "@/lib/neon-works";
import { resolveWorkClient } from "@/lib/local-seeds";
import { WorkDetailBody } from "./WorkDetailBody";

/** デモ → Neon → 端末内シードの順で解決 */
export function WorkDetailGate({
  workId,
  initialWork,
}: {
  workId: string;
  initialWork: Work | null;
}) {
  const [work, setWork] = useState<Work | null>(initialWork);
  const [loading, setLoading] = useState(!initialWork);

  useEffect(() => {
    if (initialWork) {
      setWork(initialWork);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      if (isNeonWorkId(workId)) {
        try {
          const res = await fetch(`/api/works/${encodeURIComponent(workId)}`);
          if (res.ok) {
            const data = (await res.json()) as { work?: Work };
            if (!cancelled && data.work) {
              setWork(data.work);
              setLoading(false);
              return;
            }
          }
        } catch {
          /* fall through */
        }
      }
      if (!cancelled) {
        setWork(resolveWorkClient(workId));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workId, initialWork]);

  if (loading) {
    return (
      <div className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
        読み込み中…
      </div>
    );
  }

  if (!work) {
    return (
      <div className="max-w-lg px-4 py-10 text-[14px] leading-relaxed text-viscum-muted">
        <p>この作品は見つかりませんでした。</p>
        <p className="mt-2">
          古い「local_」付きURLは、シードしたブラウザの端末内データです。ログインして新しくシードすると、共有できるURLになります。
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
