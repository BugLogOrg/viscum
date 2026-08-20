"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CommentList } from "@/components/CommentList";
import { formatYen, type Comment, type CompStatus } from "@/data/dummy-works";
import {
  addLocalComment,
  readLocalComments,
} from "@/lib/local-comments";

type Props = {
  workId: string;
  status: CompStatus;
  prizeYen?: number;
  paymentsDone?: number;
  deadlineLine: string | null;
  initialComments: Comment[];
  /** 採用済み未払いがあるか（決済ヒント） */
  hasAdoptedUntipped: boolean;
  /** 聞くこと／募集の目安（コメント足場） */
  scaffoldLabel?: string;
  scaffoldLines?: string[];
};

/**
 * コンペ帯＋コメント投稿＋一覧。
 * 締切後もコメント可。賞金対象外であることは必ず明示（ADR-015）。
 */
export function WorkEngage({
  workId,
  status,
  prizeYen,
  paymentsDone,
  deadlineLine,
  initialComments,
  hasAdoptedUntipped,
  scaffoldLabel,
  scaffoldLines = [],
}: Props) {
  const { data: session } = useSession();
  const [localExtra, setLocalExtra] = useState<Comment[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justPosted, setJustPosted] = useState(false);

  useEffect(() => {
    setLocalExtra(readLocalComments(workId));
  }, [workId]);

  const comments = useMemo(
    () => [...localExtra, ...initialComments],
    [localExtra, initialComments],
  );

  const showCompBand =
    status === "open" || status === "pay_soon" || status === "closed";
  const compActive = status === "open" || status === "pay_soon";
  const compClosed = status === "closed";
  /** コンペなし（感想歓迎）も投稿可 */
  const canPost =
    status === "open" ||
    status === "pay_soon" ||
    status === "closed" ||
    status === "none";

  function startCompose() {
    setOpenForm(true);
    setJustPosted(false);
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = subject.trim();
    const b = body.trim();
    if (!s || !b) {
      setError("件名と本文の両方を書いてください。");
      return;
    }
    const handle = session?.user?.handle?.replace(/^@/, "").trim();
    const author = handle || "ゲスト";
    const accountName =
      session?.user?.name?.trim() &&
      session.user.name.trim().toLowerCase() !== handle?.toLowerCase()
        ? session.user.name.trim()
        : undefined;
    const row = addLocalComment(workId, {
      author,
      accountName,
      subject: s,
      body: b,
      afterClose: compClosed,
    });
    setLocalExtra(readLocalComments(workId));
    setSubject("");
    setBody("");
    setOpenForm(false);
    setJustPosted(true);
    setError(null);
    // 一覧の先頭が新着なので、少し下にスクロールしやすいよう id を残す
    void row;
  }

  return (
    <div className="space-y-4">
      {compActive && (
        <p className="text-[15px] leading-relaxed text-viscum-muted">
          見てほしいところは入口です。ここに書かれていないことでも、気づいたら書いて大丈夫です。
        </p>
      )}

      {showCompBand && (
        <div className="rounded-lg border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-3 text-sm">
          <p className="font-medium text-viscum-berry-deep">コンペ帯</p>
          <p className="mt-1 text-viscum-ink">
            {prizeYen
              ? `予算 ${formatYen(prizeYen)}（採用した人に褒賞）`
              : "予算なし"}
            {deadlineLine ? ` · 締切 ${deadlineLine}` : ""}
            {status === "pay_soon" && " · 決済準備中"}
            {compClosed && " · 受付終了"}
            {typeof paymentsDone === "number" &&
              paymentsDone > 0 &&
              ` · 支払い完了 ${paymentsDone}件`}
            {compActive &&
              paymentsDone === 0 &&
              hasAdoptedUntipped &&
              " · 採用済み・支払い待ち"}
          </p>

          {compClosed && (
            <div
              className="mt-2 rounded-md border border-viscum-bark bg-viscum-paper px-2.5 py-2 text-[12px] leading-relaxed text-viscum-ink"
              role="status"
            >
              <p className="font-semibold text-viscum-berry-deep">
                このコンペは締め切っています
              </p>
              <p className="mt-1 text-viscum-muted">
                このラウンドの賞金・チップ対象にはなりません。再コンペの希望や、追加の感想・指摘のコメントは歓迎です。
              </p>
            </div>
          )}

          {compClosed && (paymentsDone ?? 0) > 0 && (
            <p className="mt-2 text-[12px] text-viscum-muted">
              採用時支払いは完了済み。メンターはコメント展開先の「受け取る」から出金（デモ）。
            </p>
          )}
          {compActive && hasAdoptedUntipped && (
            <p className="mt-2 text-[12px] text-viscum-muted">
              決済準備中の先: コメントを展開 →「採用して支払う」で Checkout
              デモへ。
            </p>
          )}

          {!openForm && (
            <button
              type="button"
              onClick={startCompose}
              className="mt-3 w-full rounded-md bg-viscum-berry px-3 py-2 text-sm font-medium text-white hover:bg-viscum-berry-deep"
            >
              {compClosed
                ? "コメントする（コンペは終了）"
                : "参加してコメント"}
            </button>
          )}
        </div>
      )}

      {status === "none" && !openForm && (
        <button
          type="button"
          onClick={startCompose}
          className="w-full rounded-md border border-viscum-brand bg-viscum-leaf-soft/50 px-3 py-2.5 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
        >
          コメントする
        </button>
      )}

      {justPosted && (
        <p className="rounded-md border border-viscum-moss/40 bg-viscum-leaf-soft/50 px-3 py-2 text-[13px] text-viscum-leaf-deep">
          コメントを受け付けました
          {compClosed ? "（終了後・賞金対象外）" : ""}。下の一覧に追加されています。
        </p>
      )}

      {openForm && canPost && (
        <form
          onSubmit={submit}
          className="space-y-3 rounded-lg border border-viscum-line bg-white/70 px-3 py-3"
        >
          <h3 className="text-[14px] font-semibold text-viscum-ink">
            {compClosed ? "終了後コメント" : "コメントを書く"}
          </h3>
          {compClosed && (
            <p className="text-[12px] leading-relaxed text-viscum-berry-deep">
              締切済みのため、このコメントはコンペの賞金対象外です。再コンペ希望や感想として送られます。
            </p>
          )}
          <label className="block space-y-1">
            <span className="text-[12px] text-viscum-muted">件名</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={80}
              placeholder="一言の見出し"
              className="w-full rounded-md border border-viscum-line bg-viscum-paper px-3 py-2 text-[14px] text-viscum-ink outline-none focus:border-viscum-brand"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[12px] text-viscum-muted">本文</span>
            {scaffoldLabel && scaffoldLines.length > 0 && (
              <div className="rounded-md border border-viscum-line/80 bg-viscum-paper-2/80 px-2.5 py-2">
                <p className="text-[11px] font-medium text-viscum-ink">
                  {scaffoldLabel}に沿って書くと読みやすいです
                </p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[11px] leading-snug text-viscum-muted">
                  {scaffoldLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              </div>
            )}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder={
                compClosed
                  ? "再コンペの希望、追加の指摘、感想など"
                  : scaffoldLines.length > 0
                    ? "番号つきで答えても、自由文でも大丈夫です"
                    : "気づいたことを書いてください（範囲外もOK）"
              }
              className="w-full resize-y rounded-md border border-viscum-line bg-viscum-paper px-3 py-2 text-[14px] leading-relaxed text-viscum-ink outline-none focus:border-viscum-brand"
            />
          </label>
          {error && (
            <p className="text-[12px] text-viscum-berry-deep">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep"
            >
              送信する
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenForm(false);
                setError(null);
              }}
              className="rounded-md border border-viscum-line px-3 py-2.5 text-sm text-viscum-muted"
            >
              やめる
            </button>
          </div>
        </form>
      )}

      <CommentList
        comments={comments}
        status={status}
        prizeYen={prizeYen}
      />
    </div>
  );
}
