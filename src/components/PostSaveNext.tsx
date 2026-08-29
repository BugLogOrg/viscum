"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Work } from "@/data/dummy-works";
import { formatDeadlineLine, planBadgeLabel } from "@/data/dummy-works";
import { THUMB_ASPECT } from "@/components/WorkFeedRow";
import {
  isLocalSeedListed,
  publishLocalSeedToShelf,
  readLocalSeeds,
} from "@/lib/local-seeds";
import { buildWorkShareText, buildXIntentUrl } from "@/lib/work-share-text";
import {
  announcePublishedSeedToX,
  announceResultMessage,
} from "@/lib/announce-published-seed";

type Step = "draft" | "published";

const TONE: Record<Work["thumbTone"], string> = {
  leaf: "bg-viscum-leaf-deep",
  moss: "bg-viscum-moss",
  berry: "bg-viscum-berry",
  bark: "bg-viscum-bark",
  trunk: "bg-viscum-trunk",
};

/**
 * 棚レーン保存直後（?seeded=1）。
 * 公開が本線。直依頼は別入口（ADR-038）。
 */
export function PostSaveNext({ work }: { work: Work }) {
  const search = useSearchParams();
  const router = useRouter();
  const show = search.get("seeded") === "1";
  const [step, setStep] = useState<Step>("draft");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [xNote, setXNote] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    const seed = readLocalSeeds().find((s) => s.id === work.id);
    if (seed?.lane === "direct_request" || work.id.startsWith("drq_")) {
      router.replace(`/w/${encodeURIComponent(work.id)}/request`);
      return;
    }
    setOrigin(window.location.origin);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (seed && isLocalSeedListed(seed)) setStep("published");
  }, [show, work.id, router]);

  const text = useMemo(
    () => (origin ? buildWorkShareText(work, origin) : ""),
    [work, origin],
  );

  const deadlineLine = formatDeadlineLine(work.closesInHours, work.status);
  const plan = planBadgeLabel(work.plan);

  async function publishNow() {
    const ok = window.confirm(
      "作品一覧（トップ）に公開します。誰でも見られるようになります。よろしいですか？",
    );
    if (!ok) return;
    setBusy(true);
    setXNote(null);
    publishLocalSeedToShelf(work.id);
    const r = await announcePublishedSeedToX(work);
    const msg = announceResultMessage(r);
    if (msg) setXNote(msg);
    setStep("published");
    setBusy(false);
  }

  if (!show) return null;

  const preview = (
    <div className="overflow-hidden rounded-md border border-viscum-line bg-white/80">
      <div
        className={`relative w-full ${THUMB_ASPECT} ${TONE[work.thumbTone]}`}
        style={{ aspectRatio: "1280 / 670" }}
        aria-hidden
      >
        {work.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={work.thumbUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="space-y-1 px-3 py-3">
        <p className="text-[11px] text-viscum-muted">
          {plan ? `${plan} · ` : ""}
          {deadlineLine || "下書き"}
        </p>
        <p className="text-[14px] font-semibold leading-snug text-viscum-ink">
          {work.title}
        </p>
      </div>
    </div>
  );

  if (step === "published") {
    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[13px] text-viscum-brand underline"
          >
            ← 戻る（作品一覧）
          </button>
          <Link
            href="/dashboard"
            className="text-[12px] text-viscum-muted underline"
          >
            ダッシュボード
          </Link>
        </div>

        <div className="space-y-2 rounded-lg border border-viscum-leaf/40 bg-viscum-leaf-soft/40 px-4 py-4">
          <p className="text-[15px] font-semibold text-viscum-leaf-deep">
            公開しました
          </p>
          <p className="text-[13px] leading-relaxed text-viscum-ink">
            作品一覧に載っています。ここから先のSNS投稿は任意です（コピーして自分のXなどに貼れます）。
          </p>
          {xNote ? (
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-viscum-muted">
              {xNote}
            </p>
          ) : null}
        </div>

        {preview}

        <div className="space-y-2 rounded-lg border border-viscum-line bg-white/70 px-4 py-3">
          <p className="text-[12px] font-medium text-viscum-ink">
            SNS用の文（任意）
          </p>
          <p className="text-[11px] leading-relaxed text-viscum-muted">
            聞きたいことは入れていません。詳しくはリンク先で。公開URLなら投稿に付けるとカード（タイトル・画像）が出ます。端末内だけの下書きURLはXから見えません。
          </p>
          <pre className="whitespace-pre-wrap break-all rounded-md border border-viscum-line bg-viscum-paper-2/80 px-3 py-2 text-[12px] text-viscum-trunk">
            {text || "…"}
          </pre>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="flex-1 rounded-md border border-viscum-brand px-4 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
              onClick={() => {
                if (!text) return;
                void navigator.clipboard?.writeText(text).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                });
              }}
            >
              {copied ? "コピーしました" : "告知文をコピー"}
            </button>
            <a
              href={text ? buildXIntentUrl(text) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!text}
              className={`flex-1 rounded-md bg-viscum-ink px-4 py-2.5 text-center text-sm font-medium text-white hover:opacity-90 ${
                text ? "" : "pointer-events-none opacity-40"
              }`}
            >
              Xで開く
            </a>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-md bg-viscum-berry px-4 py-3 text-sm font-medium text-white hover:bg-viscum-berry-deep"
          onClick={() =>
            router.push(`/?published=${encodeURIComponent(work.id)}`)
          }
        >
          作品を見にいく
        </button>

        <p className="text-center text-[12px] leading-relaxed text-viscum-muted">
          特定の人にも見てほしいときは、上の<strong>告知文をコピー</strong>してDMやXに貼るのが本線です（公開のまま）。
          有償で指名したいときだけ、別途{" "}
          <Link href="/new/request" className="text-viscum-brand underline">
            直依頼レーン（非公開・別ID）
          </Link>
          から新規作成します。この公開シードには直依頼を足しません。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/new/shelf")}
          className="text-[13px] text-viscum-brand underline"
        >
          ← 戻る（投稿画面）
        </button>
        <Link
          href="/dashboard#drafts"
          className="text-[12px] text-viscum-muted underline"
        >
          下書き一覧
        </Link>
      </div>

      <div className="space-y-2 rounded-lg border border-viscum-berry/30 bg-viscum-berry/5 px-4 py-4">
        <p className="text-[15px] font-semibold text-viscum-berry-deep">
          一旦保存しました
        </p>
        <p className="text-[13px] leading-relaxed text-viscum-ink">
          まだ誰の目にも触れていません。公開すると作品一覧に出ます。
          <br />
          あとから確認するときは{" "}
          <Link href="/dashboard" className="text-viscum-brand underline">
            「ダッシュボード」
          </Link>
          を見てください。
        </p>
      </div>

      {preview}

      <div className="space-y-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void publishNow()}
          className="w-full rounded-md bg-viscum-berry px-4 py-3 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
        >
          {busy ? "公開中…" : "公開する（作品一覧に出す）"}
        </button>
        <p className="text-center text-[11px] leading-relaxed text-viscum-muted">
          公開後に特定の人へ届けるのは告知文コピーが本線。有償の指名は{" "}
          <Link href="/new/request" className="text-viscum-brand underline">
            直依頼レーン（非公開）
          </Link>
          で別ID作成。
        </p>
      </div>

      <div className="space-y-2 text-center text-[13px]">
        <Link
          href="/dashboard#drafts"
          className="block text-viscum-muted underline"
        >
          あとで公開する（下書き一覧へ）
        </Link>
        <Link
          href={`/w/${encodeURIComponent(work.id)}`}
          className="block text-viscum-muted underline"
        >
          保存した内容を確認する
        </Link>
      </div>
    </div>
  );
}
