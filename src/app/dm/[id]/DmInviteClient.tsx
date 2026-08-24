"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { ViscumMark } from "@/components/ViscumMark";
import {
  formatDeadlineLine,
  formatPostedLine,
  formatYen,
  type Work,
} from "@/data/dummy-works";
import { resolveWorkClient } from "@/lib/local-seeds";
import { SeederCredibilityLink } from "@/components/SeederCredibilityLink";
import { accountLabelForHandle } from "@/data/suggested-seeders";

/**
 * 作品ID着地（デモ作品など）。
 * 返事の正本は /dm/i/…（Neon招待）→ ご依頼DM。ここでは送らない。
 */
export function DmInviteClient({
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
    const isLocal = workId.startsWith("local_");
    return (
      <div className="min-h-dvh bg-viscum-paper px-4 py-10 text-viscum-ink">
        <p className="text-[14px] leading-relaxed text-viscum-muted">
          {isLocal
            ? "このURLは端末内デモ用です。別のブラウザ／端末では作品データがありません。"
            : "このお願いの作品が見つかりませんでした。"}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-viscum-muted">
          相手に渡すときは、直依頼画面の<strong>外部用テンプレ</strong>から
          案内文（招待リンク付き）をコピーしてください。別端末でも開け、返事はご依頼DMに届きます。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-[13px]">
          <Link href="/dm/promo-15s" className="text-viscum-brand underline">
            デモの着地を見る
          </Link>
          <Link href="/" className="text-viscum-brand underline">
            ホームへ
          </Link>
        </div>
      </div>
    );
  }

  const deadlineLine = formatDeadlineLine(work.closesInHours, work.status);
  const postedLine = formatPostedLine(work.hoursAgo);
  const seederLabel = accountLabelForHandle(work.seeder);
  const thumbUrl = work.thumbUrl?.trim() || "";
  const prize = work.prizeYen ?? null;
  const isLocal = work.id.startsWith("local_");

  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <header className="border-b border-viscum-line bg-viscum-leaf-deep px-4 py-3.5 text-white">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-white hover:opacity-90"
        >
          <ViscumMark className="h-5 w-5" />
          VISCUM
        </Link>
      </header>

      <main className="mx-auto max-w-lg pb-8">
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
            <span className="block">{seederLabel.line} から、</span>
            <span className="block">あなた宛てのお願いです</span>
          </h1>

          <div className="rounded-xl border-2 border-viscum-berry/50 bg-viscum-berry/10 px-4 py-3.5">
            <p className="text-[18px] font-semibold tabular-nums text-viscum-berry-deep">
              褒賞：{prize != null && prize > 0 ? formatYen(prize) : "—"}
            </p>
            <dl className="mt-2 space-y-1 text-[13px] text-viscum-ink">
              <div>
                <dt className="inline text-viscum-muted">投稿：</dt>
                <dd className="inline">{postedLine}</dd>
              </div>
              {deadlineLine ? (
                <div>
                  <dt className="inline text-viscum-muted">締切：</dt>
                  <dd className="inline font-medium">{deadlineLine}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div>
            <p className="text-[12px] text-viscum-muted">作品</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug text-viscum-ink">
              {work.title}
            </h2>
          </div>

          <section className="space-y-2">
            <p className="text-[12px] text-viscum-muted">お願いの内容</p>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
              {work.description}
            </p>
            {(work.prompts?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-viscum-line bg-white/50 px-3 py-3">
                <p className="text-[11px] font-medium text-viscum-muted">
                  聞きたいこと
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-viscum-ink">
                  {work.prompts!.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {work.tags.length > 0 && (
              <p className="text-[12px] text-viscum-muted">
                タグ：{work.tags.join(" / ")}
              </p>
            )}
          </section>

          <div>
            <p className="mb-1.5 text-[12px] text-viscum-muted">
              お願いしたい作品
            </p>
            <a
              href={work.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-md border border-viscum-brand px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
            >
              作品URLを開く
            </a>
          </div>

          <SeederCredibilityLink handle={work.seeder} />

          <section className="rounded-xl border border-viscum-brand/30 bg-white/70 px-4 py-4">
            <p className="text-[13px] font-medium text-viscum-ink">
              依頼主へ返事する
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
              返事は依頼主の<strong>ご依頼DM</strong>
              に届きます（作品コメントには残しません）。
              {isLocal
                ? " このURLは端末内デモ用です。実際の共有は /dm/i/… の招待リンクを使ってください。"
                : " 本番の共有は直依頼画面で発行する /dm/i/… からお願いします。"}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/dashboard/messages"
                className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
              >
                ご依頼DMを開く
              </Link>
              <Link
                href="/faq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-[12px] font-medium text-viscum-brand underline"
              >
                届く→返す→払うの流れ（FAQ）
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-viscum-line bg-viscum-paper-2/50 px-4 py-4">
            <p className="text-[13px] font-medium text-viscum-ink">
              VISCUMって何？
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-viscum-muted">
              シーダー（種を撒く人）が作品を出し、必要なときだけコメントをお願いする場。入場無料。稼ぐ副業アプリではなく、小さな広告費の出口です。
            </p>
            <Link
              href="/lp"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-[13px] font-medium text-viscum-brand underline"
            >
              LPでもう少し見る
            </Link>
          </section>

          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
