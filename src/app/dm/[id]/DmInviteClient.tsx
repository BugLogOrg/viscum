"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";
import { ViscumMark } from "@/components/ViscumMark";
import {
  formatDeadlineLine,
  formatPostedLine,
  formatYen,
  type Work,
} from "@/data/dummy-works";
import { resolveWorkClient } from "@/lib/local-seeds";
import { postWorkComment } from "@/lib/remote-comments";
import { SeederCredibilityLink } from "@/components/SeederCredibilityLink";
import { accountLabelForHandle } from "@/data/suggested-seeders";

/**
 * 外部DM用の着地。未登録者向け。
 * 流れ: VISCUMって何？ → サムネ → 依頼 → 作品URL → 支払実績 → 返事を書く
 */
export function DmInviteClient({
  workId,
  initialWork,
}: {
  workId: string;
  initialWork: Work | null;
}) {
  const { data: session, status: authStatus } = useSession();
  const handle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";
  const canWrite = Boolean(session?.user?.id && handle);

  const [work, setWork] = useState<Work | null>(initialWork);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentOk, setSentOk] = useState(false);

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
  const isLocal = work.id.startsWith("local_");
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/dm/${work.id}`)}`;
  const messagesHref = "/dashboard/messages";

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    if (isLocal) {
      setSendError(
        "この作品はまだ相手の端末内です。作品URLを見たうえで、ログインしてご依頼DMから返事してください。",
      );
      return;
    }
    if (!canWrite) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await postWorkComment({
        workId: work!.id,
        subject: "直依頼への返事",
        body: text,
      });
      if (res.ok) {
        setBody("");
        setSentOk(true);
      } else {
        setSendError(res.error || "送れませんでした");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <header className="border-b border-viscum-line bg-viscum-leaf-deep px-4 py-3.5 text-white">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em]">
          <ViscumMark className="h-5 w-5" />
          VISCUM
        </p>
      </header>

      <main className="mx-auto max-w-lg pb-8">
        <section className="border-b border-viscum-line bg-viscum-paper-2/60 px-4 py-4">
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
            className="mt-2 inline-block text-[12px] font-medium text-viscum-brand underline"
          >
            LPでもう少し見る
          </Link>
        </section>

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

          {/* 次にやること＝返事 */}
          <section className="rounded-xl border border-viscum-brand/30 bg-white/70 px-4 py-4">
            <p className="text-[13px] font-medium text-viscum-ink">
              返事・コメントを書く
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
              作品を見たあとに、ここに書いて送ってください。ログインが必要です（無料）。
            </p>

            {sentOk ? (
              <p className="mt-3 rounded-md border border-viscum-brand/30 bg-viscum-leaf-soft/40 px-3 py-2 text-[13px] text-viscum-ink">
                送りました。ありがとうございます。
                {!isLocal ? (
                  <>
                    {" "}
                    <Link
                      href={`/w/${work.id}`}
                      className="font-medium text-viscum-brand underline"
                    >
                      作品ページで確認
                    </Link>
                  </>
                ) : null}
              </p>
            ) : (
              <form onSubmit={sendReply} className="mt-3 space-y-3">
                <textarea
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setSendError(null);
                  }}
                  rows={5}
                  placeholder="見た感想・気づいた点・質問など"
                  className="w-full resize-y rounded-md border border-viscum-line bg-white px-3 py-2 text-[14px] text-viscum-ink placeholder:text-viscum-muted"
                />
                {sendError && (
                  <p className="text-[12px] text-viscum-berry-deep">{sendError}</p>
                )}

                {authStatus === "loading" ? (
                  <p className="text-[12px] text-viscum-muted">確認中…</p>
                ) : canWrite && isLocal ? (
                  <div className="space-y-2">
                    <Link
                      href={messagesHref}
                      className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
                    >
                      ご依頼DMで返事する
                    </Link>
                    <p className="text-[11px] leading-relaxed text-viscum-muted">
                      この作品はまだ相手の端末内です。上に下書きしてから、ご依頼DMへ貼っても大丈夫です。
                    </p>
                  </div>
                ) : canWrite ? (
                  <button
                    type="submit"
                    disabled={sending || !body.trim()}
                    className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                  >
                    {sending ? "送信中…" : "返事を送る"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={loginHref}
                      className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
                    >
                      ログインして返事を送る
                    </Link>
                    <p className="text-[11px] leading-relaxed text-viscum-muted">
                      アカウント作成も同じ画面からできます。英語IDがあればコメントを送れます。
                    </p>
                  </div>
                )}
              </form>
            )}
          </section>

          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
