"use client";

import { useEffect, useState } from "react";
import type { Comment, CompStatus } from "@/data/dummy-works";
import { formatHoursAgo, formatYen } from "@/data/dummy-works";
import { LinkifiedText } from "@/components/LinkifiedText";

export function CommentList({
  comments,
  status,
  prizeYen,
}: {
  comments: Comment[];
  status: CompStatus;
  prizeYen?: number;
}) {
  const [openId, setOpenId] = useState<string | null>(
    comments.find((c) => c.adopted)?.id ?? comments[0]?.id ?? null,
  );

  useEffect(() => {
    const newest = comments[0];
    if (newest?.id.startsWith("local_c_")) {
      setOpenId(newest.id);
    }
  }, [comments]);

  const tipLabel = prizeYen ? formatYen(prizeYen) : "¥3,000";

  return (
    <section className="border-t border-viscum-line pt-4" aria-label="コメント">
      <h2 className="text-sm font-medium text-viscum-ink">
        コメント · {comments.length}
      </h2>
      <p className="mt-1 text-[11px] text-viscum-muted">
        件名をタップして本文を展開（Gmail型）
      </p>

      {comments.length === 0 && (
        <p className="mt-3 text-sm text-viscum-muted">
          まだコメントがありません。
        </p>
      )}

      <ul className="mt-3 divide-y divide-viscum-line overflow-hidden rounded-lg border border-viscum-line bg-white/50">
        {comments.map((c) => {
          const open = openId === c.id;
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
                    {c.author} · {formatHoursAgo(c.hoursAgo)}
                    {!open && (
                      <>
                        <span className="text-viscum-line"> · </span>
                        <span className="line-clamp-1 font-normal text-viscum-muted/80">
                          {c.body}
                        </span>
                      </>
                    )}
                  </span>
                </span>
              </button>

              {open && (
                <div className="border-t border-viscum-line/80 bg-viscum-paper px-3 py-3 pl-9">
                  <p className="text-sm leading-relaxed text-viscum-ink">
                    <LinkifiedText text={c.body} />
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!c.adopted && !c.afterClose && (
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

                    {c.adopted && !c.tipped && status !== "none" && (
                      <button
                        type="button"
                        className="rounded-md bg-viscum-berry px-2.5 py-1 text-[11px] font-medium text-white"
                        onClick={() => {
                          window.alert(
                            [
                              "【デモ】採用時支払い（Checkout）",
                              "",
                              `金額: ${tipLabel}（広告費として）`,
                              "次: Stripe Checkout（実決済なし）",
                              "完了後: コメントに「支払い済み」＋メンターへ出金リンク",
                            ].join("\n"),
                          );
                        }}
                      >
                        採用して支払う {tipLabel}
                      </button>
                    )}

                    {c.tipped && (
                      <>
                        <span className="rounded border border-viscum-berry/40 bg-viscum-berry/10 px-2 py-0.5 text-[11px] font-medium text-viscum-berry-deep">
                          チップ支払い済み{" "}
                          {formatYen(c.tipYen ?? prizeYen ?? 3000)}
                        </span>
                        <button
                          type="button"
                          className="rounded-md border border-viscum-moss bg-viscum-leaf-soft px-2.5 py-1 text-[11px] font-medium text-viscum-leaf-deep"
                          onClick={() => {
                            window.alert(
                              [
                                "【デモ】メンター出金（Connect）",
                                "",
                                "コメント時は口座登録なし（三鉄則）。",
                                "採用・支払い確定後だけ「受け取る」→ Connect オンボーディング。",
                                "このデモでは実際の出金は行いません。",
                              ].join("\n"),
                            );
                          }}
                        >
                          受け取る（Connect・デモ）
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
