"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CommentBody, commentPreviewPlain } from "@/components/CommentBody";
import type { Comment, CompStatus } from "@/data/dummy-works";
import { formatHoursAgo, formatYen } from "@/data/dummy-works";
import { accountLabelForHandle } from "@/data/suggested-seeders";
import { readLocalProfile } from "@/lib/local-profile";

const NEON_COMMENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPortfolioHandle(raw: string) {
  return /^[a-zA-Z0-9_]{2,24}$/.test(raw);
}

function isNeonCommentId(id: string) {
  return NEON_COMMENT_ID.test(id);
}

/** 英語IDなら PF へ。アカウント名があれば併記 */
function CommentAuthor({
  author,
  accountName,
}: {
  author: string;
  accountName?: string;
}) {
  const raw = author.replace(/^@/, "").trim();
  if (!isPortfolioHandle(raw)) {
    return <span>{author.startsWith("@") ? author : author}</span>;
  }

  const demo = accountLabelForHandle(raw);
  const localName =
    typeof window !== "undefined"
      ? readLocalProfile(raw)?.accountName?.trim()
      : undefined;
  const name =
    accountName?.trim() ||
    localName ||
    (demo.accountName.toLowerCase() !== raw.toLowerCase()
      ? demo.accountName
      : "");
  const label = name ? `${name} @${raw}` : `@${raw}`;

  return (
    <Link
      href={`/u/${encodeURIComponent(raw)}`}
      onClick={(e) => e.stopPropagation()}
      className="font-medium text-viscum-trunk underline decoration-viscum-line underline-offset-2 hover:text-viscum-brand hover:decoration-viscum-brand"
    >
      {label}
    </Link>
  );
}

export function CommentList({
  comments,
  status,
  prizeYen,
  workId,
}: {
  comments: Comment[];
  status: CompStatus;
  prizeYen?: number;
  workId: string;
}) {
  const [openId, setOpenId] = useState<string | null>(
    comments.find((c) => c.adopted)?.id ?? comments[0]?.id ?? null,
  );
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    const newest = comments[0];
    if (newest?.id.startsWith("local_c_") || isNeonCommentId(newest?.id ?? "")) {
      setOpenId(newest.id);
    }
  }, [comments]);

  const tipLabel = prizeYen ? formatYen(prizeYen) : "¥5,000";
  const amountYen = prizeYen && prizeYen >= 5000 ? prizeYen : 5000;

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

  return (
    <section className="border-t border-viscum-line pt-4" aria-label="コメント">
      <h2 className="text-[20px] font-bold text-viscum-ink">
        コメント · {comments.length}件
      </h2>
      <p className="mt-1 text-[11px] text-viscum-muted">
        件名をタップして本文を展開（Gmail型）
      </p>
      {payError && (
        <p className="mt-2 rounded-md border border-viscum-berry/40 bg-viscum-berry/10 px-3 py-2 text-[12px] text-viscum-berry-deep">
          {payError}
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
          const canPayLive =
            neon &&
            !c.tipped &&
            !c.afterClose &&
            status !== "none" &&
            status !== "closed";
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
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-viscum-ink">
                      {c.subject}
                    </span>
                    {c.adopted && (
                      <span className="rounded bg-viscum-leaf-soft px-1.5 py-0.5 text-[10px] font-medium text-viscum-leaf-deep">
                        採用
                      </span>
                    )}
                    {c.afterClose && (
                      <span className="rounded bg-viscum-paper-2 px-1.5 py-0.5 text-[10px] font-medium text-viscum-muted">
                        終了後・対象外
                      </span>
                    )}
                    {c.tipped && (
                      <span className="rounded bg-viscum-berry/15 px-1.5 py-0.5 text-[10px] font-medium text-viscum-berry-deep">
                        支払い済み
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-viscum-muted">
                    <CommentAuthor
                      author={c.author}
                      accountName={c.accountName}
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
                    {!c.adopted && !c.afterClose && !neon && (
                      <>
                        <span className="rounded border border-viscum-line px-2 py-0.5 text-[11px] text-viscum-muted">
                          ありがとう
                        </span>
                        <span className="rounded border border-viscum-moss/40 bg-viscum-leaf-soft px-2 py-0.5 text-[11px] text-viscum-leaf-deep">
                          採用
                        </span>
                        {status !== "none" && status !== "closed" && (
                          <span className="rounded bg-viscum-berry px-2 py-0.5 text-[11px] text-white">
                            チップ {tipLabel}
                          </span>
                        )}
                      </>
                    )}
                    {c.afterClose && (
                      <span className="rounded border border-viscum-line px-2 py-0.5 text-[11px] text-viscum-muted">
                        終了後コメント（このラウンドの賞金対象外）
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
                          : `採用して支払う ${tipLabel}`}
                      </button>
                    )}

                    {!neon && c.adopted && !c.tipped && status !== "none" && (
                      <button
                        type="button"
                        className="rounded-md bg-viscum-berry px-2.5 py-1 text-[11px] font-medium text-white"
                        onClick={() => {
                          window.alert(
                            [
                              "デモ初期コメントは実決済対象外です。",
                              "",
                              "Neonに保存されたコメント（ログイン投稿）を開き、",
                              "「採用して支払う」で Stripe Checkout に進みます。",
                            ].join("\n"),
                          );
                        }}
                      >
                        採用して支払う {tipLabel}（デモ）
                      </button>
                    )}

                    {c.tipped && (
                      <>
                        <span className="rounded border border-viscum-berry/40 bg-viscum-berry/10 px-2 py-0.5 text-[11px] font-medium text-viscum-berry-deep">
                          チップ支払い済み{" "}
                          {formatYen(c.tipYen ?? prizeYen ?? 5000)}
                        </span>
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
