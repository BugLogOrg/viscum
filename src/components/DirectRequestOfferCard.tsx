"use client";

import type { ReactNode } from "react";
import {
  formatOfferAmount,
  formatOfferDeadlineLine,
  formatOfferPostedLine,
  splitRequestSummary,
  type DirectRequestOfferSnapshot,
} from "@/lib/direct-request-offer";

/**
 * 直依頼の正本レイアウト（招待着地 `/dm/i/…` と同型）。
 * ご依頼DM・seed詳細でも同じカードを使う。
 * depth=teaser: 未ログイン着地（タイトル・概要・金額のみ）
 */
export function DirectRequestOfferCard({
  snapshot,
  headline,
  showFeeNote = true,
  belowReward,
  afterBody,
  depth = "full",
  loginHref,
}: {
  snapshot: DirectRequestOfferSnapshot;
  /** 省略時: 「{名前} から、あなた宛てのお願いです」 */
  headline?: ReactNode;
  showFeeNote?: boolean;
  belowReward?: ReactNode;
  afterBody?: ReactNode;
  depth?: "teaser" | "full";
  /** teaser 時のログインCTA先 */
  loginHref?: string;
}) {
  const { description, prompts } = splitRequestSummary(snapshot.workSummary);
  const thumbUrl = depth === "full" ? snapshot.workThumbUrl?.trim() || "" : "";
  const externalUrl =
    depth === "full" ? snapshot.workExternalUrl?.trim() || "" : "";
  const pitch = depth === "full" ? snapshot.pitch?.trim() || "" : "";
  const postedLine =
    depth === "full" ? formatOfferPostedLine(snapshot.createdAt) : null;
  const deadlineLine =
    depth === "full" ? formatOfferDeadlineLine(snapshot.closesAt) : null;
  const title = snapshot.workTitle.trim() || "（タイトル未設定）";
  const teaserBody =
    depth === "teaser"
      ? (snapshot.workSummary?.trim() ||
          "ログインすると作品URLとお願いの詳細を確認できます。")
      : "";

  const defaultHeadline = (
    <>
      <span className="block">{snapshot.fromDisplayName} から、</span>
      <span className="block">あなた宛てのお願いです</span>
    </>
  );

  return (
    <div className="overflow-hidden bg-viscum-paper text-viscum-ink">
      {thumbUrl ? (
        <div
          className="relative w-full overflow-hidden bg-viscum-leaf-deep"
          style={{ aspectRatio: "1280 / 670" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-5 px-4 pt-5">
        <h1 className="text-[15px] font-semibold leading-snug text-viscum-ink">
          {headline ?? defaultHeadline}
        </h1>

        <div className="rounded-xl border-2 border-viscum-berry/50 bg-viscum-berry/10 px-4 py-3.5">
          <p className="text-[18px] font-semibold tabular-nums text-viscum-berry-deep">
            褒賞：{formatOfferAmount(snapshot.amountYen)}
          </p>
          {showFeeNote && depth === "full" ? (
            <p className="mt-1 text-[12px] leading-snug text-viscum-muted">
              依頼主があなたに渡す額面です（手数料は依頼主負担・約10%決済込み。ここからは引きません）。
            </p>
          ) : null}
          {depth === "teaser" ? (
            <p className="mt-1 text-[12px] leading-snug text-viscum-muted">
              直依頼です。詳細・作品URL・希望日はログイン後に表示します。
            </p>
          ) : null}
          <dl className="mt-2 space-y-1 text-[13px] text-viscum-ink">
            {postedLine ? (
              <div>
                <dt className="inline text-viscum-muted">投稿：</dt>
                <dd className="inline">{postedLine}</dd>
              </div>
            ) : null}
            {deadlineLine ? (
              <div>
                <dt className="inline text-viscum-muted">希望日：</dt>
                <dd className="inline font-medium">{deadlineLine}</dd>
              </div>
            ) : null}
          </dl>
          {belowReward}
        </div>

        <div>
          <p className="text-[12px] text-viscum-muted">作品</p>
          <h2 className="mt-1 text-lg font-semibold leading-snug text-viscum-ink">
            {title}
          </h2>
        </div>

        {depth === "teaser" ? (
          <section className="space-y-3">
            <div className="space-y-2">
              <p className="text-[12px] text-viscum-muted">概要</p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                {teaserBody}
              </p>
            </div>
            <p className="rounded-md border border-viscum-line bg-white/60 px-3 py-2 text-[12px] leading-relaxed text-viscum-muted">
              ※このリンクは特定の方へのご案内です。転送・SNS等での公開はご遠慮ください。
            </p>
            {loginHref ? (
              <a
                href={loginHref}
                className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
              >
                ログインして詳細を見る
              </a>
            ) : null}
          </section>
        ) : (
          <section className="space-y-2">
            <p className="text-[12px] text-viscum-muted">お願いの内容</p>
            {description ? (
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                {description}
              </p>
            ) : pitch ? (
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                {pitch}
              </p>
            ) : (
              <p className="text-[13px] text-viscum-muted">
                （本文スナップショットなし）
              </p>
            )}
            {prompts.length > 0 ? (
              <div className="rounded-lg border border-viscum-line bg-white/50 px-3 py-3">
                <p className="text-[11px] font-medium text-viscum-muted">
                  聞きたいこと
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-viscum-ink">
                  {prompts.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {pitch && description ? (
              <div className="rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2">
                <p className="text-[11px] font-medium text-viscum-muted">
                  お願いの一言
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                  {pitch}
                </p>
              </div>
            ) : null}
          </section>
        )}

        {externalUrl ? (
          <div>
            <p className="mb-1.5 text-[12px] text-viscum-muted">
              お願いしたい作品
            </p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-md border border-viscum-brand px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
            >
              作品URLを開く
            </a>
          </div>
        ) : null}

        {afterBody}
      </div>
    </div>
  );
}
