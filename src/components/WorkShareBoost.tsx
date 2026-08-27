"use client";

import { useEffect, useState } from "react";
import type { Work } from "@/data/dummy-works";
import { buildWorkShareText } from "@/lib/work-share-text";
import { isDirectRequestLane } from "@/lib/local-seeds";
import { ShareTextCopyButton } from "@/components/ShareTextCopyButton";

/**
 * 棚作品の告知文コピー（シーダー以外も可）。
 * 直依頼レーン／下書きでは出さない。
 */
export function WorkShareBoost({
  work,
  isDraft = false,
}: {
  work: Work;
  isDraft?: boolean;
}) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (isDraft) return null;
  if (isDirectRequestLane({ id: work.id, lane: undefined })) return null;

  const isComp =
    work.status !== "none" &&
    (work.prizeYen != null ||
      work.plan === "first_impression" ||
      work.plan === "brush_up" ||
      work.plan === "public_boost");

  return (
    <div className="space-y-2 rounded-lg border border-viscum-line bg-white/50 px-3 py-3">
      <p className="text-[12px] font-medium text-viscum-ink">
        {isComp ? "このコンペを広げる" : "このシードを広げる"}
      </p>
      <p className="text-[11px] leading-relaxed text-viscum-muted">
        SNSやチャットに貼れる告知文です。シーダー以外もコピーできます。
        {isComp
          ? " 広めると反応が増えやすい一方、ライバルも増えうる点はご承知を。"
          : null}{" "}
        公開URLならXにカード（タイトル・画像）が出ます。
      </p>
      {origin ? (
        <ShareTextCopyButton
          label="告知文をコピー"
          className="flex w-full items-center justify-center rounded-md border border-viscum-brand bg-viscum-paper px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
          getText={() => buildWorkShareText(work, origin)}
        />
      ) : null}
    </div>
  );
}
