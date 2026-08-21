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
 * 外部DM用の着地。未登録者向け。
 * 流れ: 場の一言 → 作品サムネ（インパクト）→ 個人宛て依頼 → 行動。
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
    return (
      <div className="min-h-dvh bg-viscum-paper px-4 py-10 text-viscum-ink">
        <p className="text-[14px] text-viscum-muted">
          このお願いの作品が見つかりませんでした（デモは同じブラウザの端末内保存です）。
        </p>
        <Link href="/" className="mt-4 inline-block text-viscum-brand underline">
          ホームへ
        </Link>
      </div>
    );
  }

  const deadlineLine = formatDeadlineLine(work.closesInHours, work.status);
  const postedLine = formatPostedLine(work.hoursAgo);
  const seederLabel = accountLabelForHandle(work.seeder);
  const thumbUrl = work.thumbUrl?.trim() || "";
  const prize = work.prizeYen ?? null;

  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      {/* ロゴのみ。場の説明は直下の「VISCUMって何？」に寄せる */}
      <header className="border-b border-viscum-line bg-viscum-leaf-deep px-4 py-3.5 text-white">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em]">
          <ViscumMark className="h-5 w-5" />
          VISCUM
        </p>
      </header>

      <main className="mx-auto max-w-lg pb-8">
        {/* TOP: 場の説明 */}
        <section className="border-b border-viscum-line bg-viscum-paper-2/60 px-4 py-4">
          <p className="text-[13px] font-medium text-viscum-ink">
            VISCUMって何？
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-viscum-muted">
            シーダー（種を撒く人）が作品を出し、必要なときだけコメントをお願いする場。入場無料。稼ぐ副業アプリではなく、小さな広告費の出口です。
          </p>
          <Link
            href="/lp"
            className="mt-2 inline-block text-[12px] font-medium text-viscum-brand underline"
          >
            LPでもう少し見る
          </Link>
        </section>

        {/* サムネ＝第一インパクト */}
        <div
          className="relative w-full overflow-hidden bg-viscum-leaf-deep"
          style={{ aspectRatio: "1280 / 670" }}
        >
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-white/85">
              <p className="text-[13px] font-medium">作品サムネ</p>
              <p className="text-[11px] text-white/70">
                （未添付のときはここに出ます）
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5 px-4 pt-5">
          <div>
            <p className="text-[12px] text-viscum-muted">
              個人宛て · 公開コンペではありません
              {prize != null && prize > 0 ? (
                <>
                  <span className="mx-1 text-viscum-line">·</span>
                  褒賞 {formatYen(prize)}
                </>
              ) : null}
            </p>
            <h1 className="mt-1.5 text-xl font-semibold leading-snug text-viscum-ink">
              {work.title}
            </h1>
            <p className="mt-2 text-[14px] text-viscum-ink">
              {seederLabel.line} から、あなた宛てのお願いです
            </p>
          </div>

          <SeederCredibilityLink handle={work.seeder} />

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
            <p className="text-[12px] text-viscum-muted">
              投稿：{postedLine}
              {deadlineLine ? ` · 締切：${deadlineLine}` : ""}
            </p>
            {work.tags.length > 0 && (
              <p className="text-[12px] text-viscum-muted">
                タグ：{work.tags.join(" / ")}
              </p>
            )}
          </section>

          <div className="flex flex-col gap-2 pt-1">
            {!work.id.startsWith("local_") && (
              <Link
                href={`/w/${work.id}`}
                className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
              >
                作品を見てコメントする
              </Link>
            )}
            <a
              href={work.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-md border border-viscum-brand px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
            >
              外部の作品を開く
            </a>
          </div>

          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
