"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  formatOfferAmount,
  formatOfferDeadlineLine,
  formatOfferPostedLine,
  splitRequestSummary,
  type DirectRequestOfferSnapshot,
} from "@/lib/direct-request-offer";
import { LinkifiedText } from "@/components/LinkifiedText";

/**
 * 直依頼の正本レイアウト（招待着地 `/dm/i/…` と同型）。
 * ご依頼DM・seed詳細でも同じカードを使う。
 * depth=teaser: 未ログイン着地（サムネ・タイトル・概要・金額・ご挨拶）
 */
export function DirectRequestOfferCard({
  snapshot,
  headline,
  showFeeNote = true,
  belowReward,
  afterBody,
  depth = "full",
  loginHref,
  loginAcceptHref,
  onDecline,
  declining = false,
}: {
  snapshot: DirectRequestOfferSnapshot;
  /** 省略時: 「{名前} から、あなた宛てのお願いです」 */
  headline?: ReactNode;
  showFeeNote?: boolean;
  belowReward?: ReactNode;
  afterBody?: ReactNode;
  depth?: "teaser" | "full";
  /** teaser 時のログインCTA先（詳細用・任意） */
  loginHref?: string;
  /** teaser: 「やる」→ログイン後に引き受け */
  loginAcceptHref?: string;
  /** teaser: 「いまは無理」→ログイン不要で辞退（親が API 呼び出し） */
  onDecline?: () => void;
  declining?: boolean;
}) {
  const { description, prompts } = splitRequestSummary(snapshot.workSummary);
  const thumbUrl = snapshot.workThumbUrl?.trim() || "";
  const externalUrl =
    depth === "full" ? snapshot.workExternalUrl?.trim() || "" : "";
  const pitch =
    depth === "teaser"
      ? (snapshot.pitch?.trim() || "").slice(0, 1000)
      : snapshot.pitch?.trim() || "";
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

  const showTeaserReply =
    depth === "teaser" && Boolean(loginAcceptHref && onDecline);

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
            <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
              指名でのお願いです。詳細・作品URL・希望日はログイン後に表示します。
              <span className="mt-1 block text-viscum-ink">
                見る・返事するだけで、あなたから課金されることはありません（手数料は依頼主負担）。
              </span>
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
          <section className="space-y-4">
            {pitch ? (
              <div className="rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2">
                <p className="text-[11px] font-medium text-viscum-muted">
                  ご挨拶
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                  <LinkifiedText text={pitch} />
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-[12px] text-viscum-muted">お願いの概要</p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                {teaserBody}
              </p>
            </div>

            <p className="rounded-md border border-viscum-line bg-white/60 px-3 py-2 text-[12px] leading-relaxed text-viscum-muted">
              ※このリンクは特定の方へのご案内です。転送・SNS等での公開はご遠慮ください。
            </p>

            <section className="rounded-xl border border-viscum-leaf/40 bg-viscum-leaf-soft/30 px-4 py-4">
              <p className="text-[13px] font-medium text-viscum-leaf-deep">
                VISCUMって何？
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-viscum-ink">
                個人の作品に、必要なときだけ反応をお願いする場です。見るだけ無料。返事する側に課金はありません。
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-viscum-muted">
                初めての方は、ログイン前にサービス説明と流れを確認できます。
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/lp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-viscum-brand bg-white px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                >
                  LPでサービスを見る
                </Link>
                <Link
                  href="/faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-viscum-brand bg-white px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
                >
                  FAQ（届く→返す→払う）
                </Link>
              </div>
            </section>
          </section>
        ) : (
          <section className="space-y-4">
            {pitch ? (
              <div className="rounded-md border border-viscum-line bg-viscum-paper-2/50 px-3 py-2">
                <p className="text-[11px] font-medium text-viscum-muted">
                  ご挨拶
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                  <LinkifiedText text={pitch} />
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-[12px] text-viscum-muted">
                お願いしたいことの概要
              </p>
              {description ? (
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                  {description}
                </p>
              ) : !pitch ? (
                <p className="text-[13px] text-viscum-muted">
                  （本文スナップショットなし）
                </p>
              ) : null}
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
            </div>
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

        {/* 未ログイン着地: 中身を読んでから決めるので返事は最下部 */}
        {showTeaserReply ? (
          <div className="space-y-2 rounded-lg border border-viscum-line bg-white/70 px-3 py-3">
            <p className="text-[13px] font-medium text-viscum-ink">
              このお願いへの返事
            </p>
            <p className="text-[12px] leading-relaxed text-viscum-muted">
              「やる」はログイン（無料）のあと確定します。「いまは無理」はログイン不要です。お礼を伝えて案内を閉じ、依頼主に通知します。あなたから課金はありません。
            </p>
            <div className="flex gap-2">
              <a
                href={loginAcceptHref}
                className="flex flex-1 items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-[14px] font-medium text-white hover:bg-viscum-berry-deep"
              >
                やる
              </a>
              <button
                type="button"
                disabled={declining}
                onClick={() => onDecline?.()}
                className="flex flex-1 items-center justify-center rounded-md border border-viscum-berry/45 bg-viscum-berry/5 px-3 py-2.5 text-[14px] font-medium text-viscum-berry-deep hover:bg-viscum-berry/10 disabled:opacity-50"
              >
                {declining ? "閉じています…" : "いまは無理（辞退）"}
              </button>
            </div>
            <p className="text-center text-[11px] leading-relaxed text-viscum-muted">
              作品URL・お願いの詳細・希望日は「やる」でログインしたあとに表示します。身に覚えがない場合は閉じて大丈夫です。
            </p>
          </div>
        ) : depth === "teaser" && loginHref ? (
          <div className="space-y-2">
            <a
              href={loginHref}
              className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
            >
              ログインして詳細を見る
            </a>
            <p className="text-center text-[11px] leading-relaxed text-viscum-muted">
              アカウント作成も同じ画面からできます（無料）。身に覚えがない場合は閉じて大丈夫です。
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
