"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CommentBody, commentPreviewPlain } from "@/components/CommentBody";
import { DemoBadge } from "@/components/DemoBadge";
import { ProtocolMark } from "@/components/ProtocolMark";
import type { Comment, CompStatus } from "@/data/dummy-works";
import {
  formatHoursAgo,
  formatYen,
  isDemoCommentId,
} from "@/data/dummy-works";
import {
  accountLabelForHandle,
  isDemoSeederHandle,
} from "@/data/suggested-seeders";
import { readLocalProfile } from "@/lib/local-profile";
import { addLocalThanks, readLocalThanks } from "@/lib/local-thanks";
import { removeLocalComment } from "@/lib/local-comments";
import { deleteWorkComment, postCommentThanks } from "@/lib/remote-comments";
import { PROTOCOL_COLORS } from "@/lib/protocol-colors";

const NEON_COMMENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPortfolioHandle(raw: string) {
  return /^[a-zA-Z0-9_]{2,24}$/.test(raw);
}

function isNeonCommentId(id: string) {
  return NEON_COMMENT_ID.test(id);
}

function normHandle(h: string) {
  return h.replace(/^@/, "").trim().toLowerCase();
}

/** 英語IDなら PF へ。アカウント名があれば併記。デモは「デモ用」 */
function CommentAuthor({
  author,
  accountName,
  demo,
}: {
  author: string;
  accountName?: string;
  demo?: boolean;
}) {
  const raw = author.replace(/^@/, "").trim();
  const showDemo = Boolean(demo) || isDemoSeederHandle(raw);

  if (!isPortfolioHandle(raw)) {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-1">
        <span>{author.startsWith("@") ? author : author}</span>
        {showDemo ? <DemoBadge /> : null}
      </span>
    );
  }

  const demoLabel = accountLabelForHandle(raw);
  const localName =
    typeof window !== "undefined"
      ? readLocalProfile(raw)?.accountName?.trim()
      : undefined;
  const name =
    accountName?.trim() ||
    localName ||
    (demoLabel.accountName.toLowerCase() !== raw.toLowerCase()
      ? demoLabel.accountName
      : "");
  const label = name ? `${name} @${raw}` : `@${raw}`;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-1">
      <Link
        href={`/u/${encodeURIComponent(raw)}`}
        onClick={(e) => e.stopPropagation()}
        className="font-medium text-viscum-trunk underline decoration-viscum-line underline-offset-2 hover:text-viscum-brand hover:decoration-viscum-brand"
      >
        {label}
      </Link>
      {showDemo ? <DemoBadge /> : null}
    </span>
  );
}

export function CommentList({
  comments,
  status,
  prizeYen,
  workId,
  seederHandle,
  onCommentDeleted,
}: {
  comments: Comment[];
  status: CompStatus;
  prizeYen?: number;
  workId: string;
  /** 作品のシーダー。操作ボタンはこの人だけに出す */
  seederHandle: string;
  onCommentDeleted?: (commentId: string) => void;
}) {
  const { data: session } = useSession();
  const me = normHandle(session?.user?.handle ?? "");
  const isSeeder = Boolean(me) && me === normHandle(seederHandle);

  const [openId, setOpenId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [thankedIds, setThankedIds] = useState<Set<string>>(() => new Set());
  const [thankingId, setThankingId] = useState<string | null>(null);
  const [thankError, setThankError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fromComments = comments.filter((c) => c.thanked).map((c) => c.id);
    const local = readLocalThanks(workId);
    setThankedIds(new Set([...fromComments, ...local]));
  }, [comments, workId]);

  const prizeLabel = prizeYen ? formatYen(prizeYen) : "¥5,000";
  const amountYen = prizeYen && prizeYen >= 5000 ? prizeYen : 5000;

  async function startThanks(commentId: string) {
    setThankError(null);
    setThankingId(commentId);
    addLocalThanks(workId, commentId);
    setThankedIds((prev) => new Set([...prev, commentId]));
    try {
      const res = await postCommentThanks({
        workId,
        commentId,
        seederHandle,
      });
      if (!res.ok) {
        setThankError(res.error || "お礼に失敗しました");
      }
    } finally {
      setThankingId(null);
    }
  }

  async function startCheckout(commentId: string) {
    setPayError(null);
    setPayingId(commentId);
    try {
      const res = await fetch("/api/checkout/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, workId, amountYen }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setPayError(data.error || `Checkout 開始に失敗（${res.status}）`);
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayError("ネットワークエラー");
    } finally {
      setPayingId(null);
    }
  }

  async function startDelete(c: Comment) {
    if (
      !window.confirm(
        "このコメントを削除しますか？元に戻せません。",
      )
    ) {
      return;
    }
    setDeleteError(null);
    setDeletingId(c.id);
    try {
      if (c.id.startsWith("local_c_")) {
        const res = removeLocalComment(workId, c.id);
        if (!res.ok) {
          setDeleteError(res.error);
          return;
        }
        onCommentDeleted?.(c.id);
        if (openId === c.id) setOpenId(null);
        return;
      }
      if (!isNeonCommentId(c.id)) {
        setDeleteError("デモ用コメントは削除できません");
        return;
      }
      const res = await deleteWorkComment({ workId, commentId: c.id });
      if (!res.ok) {
        setDeleteError(res.error || "削除に失敗しました");
        return;
      }
      onCommentDeleted?.(c.id);
      if (openId === c.id) setOpenId(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="border-t border-viscum-line pt-4" aria-label="コメント">
      <h2 className="text-[20px] font-bold text-viscum-ink">
        コメント · {comments.length}件
      </h2>
      <p className="mt-1 text-[11px] text-viscum-muted">
        件名をタップして本文を展開（Gmail型）
        {isSeeder
          ? " · お礼・褒賞の操作はこの画面のシーダーだけが使えます"
          : ""}
      </p>
      {payError && (
        <p className="mt-2 rounded-md border border-viscum-berry/40 bg-viscum-berry/10 px-3 py-2 text-[12px] text-viscum-berry-deep">
          {payError}
        </p>
      )}
      {thankError && (
        <p className="mt-2 rounded-md border border-viscum-berry/40 bg-viscum-berry/10 px-3 py-2 text-[12px] text-viscum-berry-deep">
          {thankError}
        </p>
      )}
      {deleteError && (
        <p className="mt-2 rounded-md border border-viscum-berry/40 bg-viscum-berry/10 px-3 py-2 text-[12px] text-viscum-berry-deep">
          {deleteError}
        </p>
      )}

      {comments.length === 0 && (
        <p className="mt-3 text-sm text-viscum-muted">
          まだコメントがありません。
        </p>
      )}

      <ul className="mt-3 divide-y divide-viscum-line overflow-hidden rounded-lg border border-viscum-line bg-white/50">
        {comments.map((c) => {
          const open = openId === c.id;
          const neon = isNeonCommentId(c.id);
          const isCommentAuthor =
            Boolean(me) && me === normHandle(c.author);
          /** 自分のコメントには褒賞UIを出さない（APIエラー前に止める） */
          const canPayLive =
            isSeeder &&
            !isCommentAuthor &&
            neon &&
            !c.tipped &&
            !c.afterClose &&
            status !== "none" &&
            status !== "closed";
          const isThanked = Boolean(c.thanked) || thankedIds.has(c.id);
          /** シーダー専用：メンターコメントへ無料お礼 */
          const canThank =
            isSeeder && !isCommentAuthor && !isThanked;
          const showSeederDemoPrize =
            isSeeder &&
            !isCommentAuthor &&
            !c.adopted &&
            !c.afterClose &&
            !neon &&
            status !== "none" &&
            status !== "closed";
          const showSeederDemoPayHint =
            isSeeder &&
            !isCommentAuthor &&
            !neon &&
            c.adopted &&
            !c.tipped &&
            status !== "none" &&
            status !== "closed";
          const canDeleteOwn =
            isCommentAuthor &&
            !c.adopted &&
            !c.tipped &&
            !isDemoCommentId(c.id);

          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : c.id)}
                className={`flex w-full items-start gap-2 px-3 py-3 text-left transition ${
                  open ? "bg-viscum-bark-soft/60" : "hover:bg-viscum-paper-2/80"
                }`}
                aria-expanded={open}
              >
                <span
                  className="mt-0.5 w-4 shrink-0 text-xs text-viscum-muted"
                  aria-hidden
                >
                  {open ? "▾" : "▸"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {c.attitude ? (
                      <span
                        className="inline-flex shrink-0"
                        title={
                          [
                            PROTOCOL_COLORS.find((p) => p.id === c.attitude)
                              ?.label,
                            PROTOCOL_COLORS.find((p) => p.id === c.attitude)
                              ?.attitude,
                          ]
                            .filter(Boolean)
                            .join("：") || undefined
                        }
                      >
                        <ProtocolMark id={c.attitude} className="h-7 w-7" />
                      </span>
                    ) : null}
                    <span className="text-sm font-semibold leading-snug text-viscum-ink">
                      {c.subject}
                    </span>
                    {isThanked && (
                      <span className="rounded bg-viscum-moss/20 px-1.5 py-0.5 text-[10px] font-medium text-viscum-trunk">
                        お礼済み
                      </span>
                    )}
                    {c.adopted && (
                      <span className="rounded bg-viscum-leaf-soft px-1.5 py-0.5 text-[10px] font-medium text-viscum-leaf-deep">
                        選出
                      </span>
                    )}
                    {c.afterClose && (
                      <span className="rounded bg-viscum-paper-2 px-1.5 py-0.5 text-[10px] font-medium text-viscum-muted">
                        終了後・対象外
                      </span>
                    )}
                    {c.tipped && (
                      <span className="rounded bg-viscum-berry/15 px-1.5 py-0.5 text-[10px] font-medium text-viscum-berry-deep">
                        褒賞済み
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-viscum-muted">
                    <CommentAuthor
                      author={c.author}
                      accountName={c.accountName}
                      demo={isDemoCommentId(c.id)}
                    />
                    <span> · {formatHoursAgo(c.hoursAgo)}</span>
                    {!open && (
                      <>
                        <span className="text-viscum-line"> · </span>
                        <span className="line-clamp-1 font-normal text-viscum-muted/80">
                          {commentPreviewPlain(c.body)}
                        </span>
                      </>
                    )}
                  </span>
                </span>
              </button>

              {open && (
                <div className="border-t border-viscum-line/80 bg-viscum-paper px-3 py-3 pl-9">
                  <CommentBody body={c.body} imageUrls={c.imageUrls} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.afterClose && (
                      <span className="rounded border border-viscum-line px-2 py-0.5 text-[11px] text-viscum-muted">
                        終了後コメント（このラウンドの褒賞対象外）
                      </span>
                    )}

                    {/* シーダー専用：お礼（無料）・褒賞（Checkout） */}
                    {canThank && (
                      <button
                        type="button"
                        disabled={thankingId === c.id}
                        className="rounded-md border border-viscum-moss bg-viscum-leaf-soft px-2.5 py-1 text-[11px] font-medium text-viscum-leaf-deep disabled:opacity-60"
                        onClick={(e) => {
                          e.stopPropagation();
                          void startThanks(c.id);
                        }}
                      >
                        {thankingId === c.id ? "お礼中…" : "お礼をする"}
                      </button>
                    )}
                    {isThanked && !canThank && (
                      <span className="rounded border border-viscum-moss/40 bg-viscum-leaf-soft/60 px-2 py-0.5 text-[11px] font-medium text-viscum-leaf-deep">
                        お礼済み
                      </span>
                    )}
                    {showSeederDemoPrize && (
                      <span className="rounded bg-viscum-berry px-2 py-0.5 text-[11px] text-white">
                        褒賞 {prizeLabel}
                      </span>
                    )}

                    {canPayLive && (
                      <button
                        type="button"
                        disabled={payingId === c.id}
                        className="rounded-md bg-viscum-berry px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-60"
                        onClick={(e) => {
                          e.stopPropagation();
                          void startCheckout(c.id);
                        }}
                      >
                        {payingId === c.id
                          ? "Checkoutへ…"
                          : `褒賞を渡す ${prizeLabel}`}
                      </button>
                    )}

                    {showSeederDemoPayHint && (
                      <button
                        type="button"
                        className="rounded-md bg-viscum-berry px-2.5 py-1 text-[11px] font-medium text-white"
                        onClick={() => {
                          window.alert(
                            [
                              "デモ初期コメントは実決済対象外です。",
                              "",
                              "Neonに保存されたコメント（ログイン投稿）を開き、",
                              "「褒賞を渡す」で Stripe Checkout に進みます。",
                            ].join("\n"),
                          );
                        }}
                      >
                        褒賞を渡す {prizeLabel}（デモ）
                      </button>
                    )}

                    {canDeleteOwn && (
                      <button
                        type="button"
                        disabled={deletingId === c.id}
                        className="rounded-md border border-viscum-line px-2.5 py-1 text-[11px] font-medium text-viscum-muted hover:border-viscum-berry hover:text-viscum-berry-deep disabled:opacity-60"
                        onClick={(e) => {
                          e.stopPropagation();
                          void startDelete(c);
                        }}
                      >
                        {deletingId === c.id ? "削除中…" : "削除"}
                      </button>
                    )}

                    {/* 結果表示は全員。受け取り操作はメンター本人だけ */}
                    {c.tipped && (
                      <>
                        <span className="rounded border border-viscum-berry/40 bg-viscum-berry/10 px-2 py-0.5 text-[11px] font-medium text-viscum-berry-deep">
                          褒賞支払い済み{" "}
                          {formatYen(c.tipYen ?? prizeYen ?? 5000)}
                        </span>
                        {isCommentAuthor ? (
                          <button
                            type="button"
                            className="rounded-md border border-viscum-moss bg-viscum-leaf-soft px-2.5 py-1 text-[11px] font-medium text-viscum-leaf-deep"
                            onClick={() => {
                              window.alert(
                                [
                                  "メンター出金（Connect）は次段です。",
                                  "",
                                  "いまはシーダーの Checkout（入金）まで。",
                                  "支払い済み後に payout=eligible になり、",
                                  "出金リンクは Connect 配線後に有効化します。",
                                ].join("\n"),
                              );
                            }}
                          >
                            受け取る（Connect・準備中）
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
