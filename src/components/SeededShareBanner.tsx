"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Work } from "@/data/dummy-works";
import {
  isLocalSeedListed,
  publishLocalSeedToShelf,
  readLocalSeeds,
} from "@/lib/local-seeds";
import { buildWorkShareText } from "@/lib/work-share-text";
import { announcePublishedSeedToX, announceResultMessage } from "@/lib/announce-published-seed";

type Step = "choose" | "confirm-public";

/**
 * シード直後（?seeded=1）：全体告知か直依頼かを押して分岐。
 * 全体告知は「公開します」確認のあとトップへ。直依頼は依頼画面へ。
 */
export function SeededShareBanner({ work }: { work: Work }) {
  const search = useSearchParams();
  const router = useRouter();
  const show = search.get("seeded") === "1";
  const [step, setStep] = useState<Step>("choose");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [listed, setListed] = useState(false);

  useEffect(() => {
    if (!show) return;
    setOrigin(window.location.origin);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const seed = readLocalSeeds().find((s) => s.id === work.id);
    setListed(seed ? isLocalSeedListed(seed) : false);
  }, [show, work.id]);

  const text = useMemo(
    () => (origin ? buildWorkShareText(work, origin) : ""),
    [work, origin],
  );

  if (!show) return null;

  if (listed && step === "choose") {
    return (
      <div className="mx-4 mb-4 mt-4 space-y-3 rounded-lg border border-viscum-leaf/40 bg-viscum-leaf-soft/40 px-4 py-4">
        <p className="text-[14px] font-medium text-viscum-leaf-deep">
          すでにトップの棚に公開済みです
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex rounded-md bg-viscum-berry px-4 py-2 text-sm font-medium text-white hover:bg-viscum-berry-deep"
          >
            トップの「すべて」を見る
          </Link>
          <Link
            href={`/w/${work.id}/request`}
            className="inline-flex rounded-md border border-viscum-brand px-4 py-2 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
          >
            直依頼する
          </Link>
        </div>
      </div>
    );
  }

  if (step === "confirm-public") {
    return (
      <div className="mx-4 mb-4 mt-4 space-y-3 rounded-lg border border-viscum-berry/30 bg-viscum-berry/5 px-4 py-4">
        <p className="text-[14px] font-medium text-viscum-berry-deep">
          公開しますか？
        </p>
        <p className="text-[13px] leading-relaxed text-viscum-ink">
          トップの「すべて」に載せて、誰でも見られる棚に出します。外への告知文も下に用意しています。
        </p>
        <pre className="whitespace-pre-wrap break-all rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-[12px] text-viscum-trunk">
          {text || "…"}
        </pre>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
            onClick={() => {
              publishLocalSeedToShelf(work.id);
              void announcePublishedSeedToX(work).then((r) => {
                const msg = announceResultMessage(r);
                if (msg) window.alert(msg);
                router.push(`/?published=${encodeURIComponent(work.id)}`);
              });
            }}
          >
            公開してトップへ
          </button>
          <button
            type="button"
            className="rounded-md border border-viscum-line px-4 py-2.5 text-sm font-medium text-viscum-ink hover:bg-viscum-paper-2"
            onClick={() => {
              if (!text) return;
              void navigator.clipboard?.writeText(text).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? "コピーしました" : "告知文だけコピー"}
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-2.5 text-sm text-viscum-muted underline"
            onClick={() => setStep("choose")}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 mt-4 space-y-4 rounded-lg border border-viscum-berry/30 bg-viscum-berry/5 px-4 py-4">
      <div>
        <p className="text-[14px] font-medium text-viscum-berry-deep">
          シードを保存しました（まだトップには出ていません）
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
          下は下書きプレビューです。公開するか、直依頼するかを選んでください。
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setStep("confirm-public")}
          className="flex-1 rounded-md bg-viscum-berry px-4 py-3 text-sm font-medium text-white hover:bg-viscum-berry-deep"
        >
          全体に告知する（公開）
        </button>
        <Link
          href={`/w/${work.id}/request`}
          className="flex flex-1 items-center justify-center rounded-md border border-viscum-brand bg-white/70 px-4 py-3 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
        >
          直依頼する
        </Link>
      </div>

      <p className="text-[11px] leading-relaxed text-viscum-muted">
        全体告知＝棚に公開してSNSなどへ流す。直依頼＝特定の人への指名（棚に出さなくても送れます）。
      </p>
    </div>
  );
}
