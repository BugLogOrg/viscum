"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { ViscumMark } from "@/components/ViscumMark";
import {
  formatDeadlineLine,
  formatPostedLine,
  type Work,
} from "@/data/dummy-works";
import { resolveWorkClient } from "@/lib/local-seeds";
import { SeederCredibilityLink } from "@/components/SeederCredibilityLink";
import { accountLabelForHandle } from "@/data/suggested-seeders";

export function DmInviteClient({
  workId,
  initialWork,
  to,
}: {
  workId: string;
  initialWork: Work | null;
  to: string | null;
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
  const askLine = `${work.title.slice(0, 48)}${work.title.length > 48 ? "…" : ""} を、あなただけに見てほしいです。見る範囲は下の説明どおりで大丈夫です。`;

  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <header className="border-b border-viscum-line bg-viscum-leaf-deep px-4 py-5 text-white">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em]">
          <ViscumMark className="h-5 w-5" />
          VISCUM
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-white/90">
          個人が作ったものに、少額の広告費で「目」を頼める場です。登録前でも中身は読めます。
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {to && (
          <p className="text-[15px] font-medium text-viscum-ink">{to}さんへ</p>
        )}
        <h1 className="mt-1 text-xl font-semibold leading-snug text-viscum-ink">
          {seederLabel.line} から、あなた宛てのお願いです
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-viscum-muted">
          公開コンペの募集ではありません。個人宛てです。
        </p>

        <SeederCredibilityLink handle={work.seeder} className="mt-5" />

        <blockquote className="mt-5 rounded-lg border border-viscum-line bg-white/50 px-3 py-3 text-[14px] leading-relaxed text-viscum-ink">
          {askLine}
        </blockquote>

        <section className="mt-6 space-y-2 border-t border-viscum-line pt-5">
          <p className="text-[12px] text-viscum-muted">作品</p>
          <h2 className="text-[15px] font-semibold leading-snug text-viscum-ink">
            {work.title}
          </h2>
          <p className="text-[14px] leading-relaxed text-viscum-ink">
            {work.description}
          </p>
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

        <div className="mt-6 flex flex-col gap-2">
          {!work.id.startsWith("local_") && (
            <Link
              href={`/w/${work.id}`}
              className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
            >
              作品を見てコメントする（デモ）
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

        <section className="mt-10 rounded-xl border border-viscum-line bg-viscum-paper-2/50 px-4 py-4">
          <p className="text-[13px] font-medium text-viscum-ink">
            VISCUMって何？
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-viscum-muted">
            シーダー（種を撒く人）が作品を出し、必要なときだけコメントをお願いする場。入場無料。稼ぐ副業アプリではなく、小さな広告費の出口です。
          </p>
          <Link
            href="/lp"
            className="mt-3 inline-block text-[13px] font-medium text-viscum-brand underline"
          >
            LPでもう少し見る
          </Link>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
