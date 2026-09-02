"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CommentBody, commentPreviewPlain } from "@/components/CommentBody";
import { DemoBadge } from "@/components/DemoBadge";
import { ProtocolMark } from "@/components/ProtocolMark";
import type { Comment, CompStatus, DemoSeedPlan } from "@/data/dummy-works";
import {
  commentTimeMs,
  formatCommentStamp,
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
import {
  planAllowsPrize,
  resolveWorkPrizeYen,
} from "@/lib/work-prize";

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

type Thread = { root: Comment; replies: Comment[] };

/** ルート＋直下返信。DBの parent は直返信先。表示はルート直下にフラット（ADR-027） */
function buildThreads(comments: Comment[]): Thread[] {
  const byId = new Map(comments.map((c) => [c.id, c]));
  const rootIdOf = (c: Comment): string => {
    let cur = c;
    const seen = new Set<string>();
    while (cur.parentId) {
      if (seen.has(cur.id)) break;
      seen.add(cur.id);
      const parent = byId.get(cur.parentId);
      if (!parent) break;
      cur = parent;
    }
    return cur.id;
  };

  const repliesByRoot = new Map<string, Comment[]>();
  const roots: Comment[] = [];
  const seenRoot = new Set<string>();

  for (const c of comments) {
    if (!c.parentId || !byId.has(c.parentId)) {
      if (!seenRoot.has(c.id)) {
        roots.push(c);
        seenRoot.add(c.id);
      }
      continue;
    }
    const rid = rootIdOf(c);
    const list = repliesByRoot.get(rid) ?? [];
    list.push(c);
    repliesByRoot.set(rid, list);
  }

  // ルートは新しいルート順。返信は古い→新しい（下に連なる）
  roots.sort((a, b) => commentTimeMs(b) - commentTimeMs(a));
  return roots.map((root) => ({
    root,
    replies: (repliesByRoot.get(root.id) ?? [])
      .filter((r) => r.id !== root.id)
      .sort((a, b) => {
        const d = commentTimeMs(a) - commentTimeMs(b);
        return d !== 0 ? d : a.id.localeCompare(b.id);
      }),
  }));
}

function quotePreview(c: Comment): string {
  const body = commentPreviewPlain(c.body);
  if (body) return body;
  return c.subject;
}

export function CommentList({
  comments,
  status,
  prizeYen,
  plan,
  workId,
  seederHandle,
  onCommentDeleted,
  onReply,
  canReply,
  replyToId,
  replyCompose,
}: {
  comments: Comment[];
  status: CompStatus;
  prizeYen?: number;
  plan?: DemoSeedPlan | null;
  workId: string;
  /** 作品のシーダー。操作ボタンはこの人だけに出す */
  seederHandle: string;
  onCommentDeleted?: (commentId: string) => void;
  /** 1段返信を開始（クリックしたコメント＝引用先） */
  onReply?: (parent: Comment) => void;
  canReply?: boolean;
  /** 返信中のコメントID。入力窓をこの直下に出す */
  replyToId?: string | null;
  replyCompose?: ReactNode;
}) {
  const { data: session } = useSession();
  const me = normHandle(session?.user?.handle ?? "");
  const isSeeder = Boolean(me) && me === normHandle(seederHandle);

  const [openId, setOpenId] = useState<string | null>(null);
  const [focusFlashId, setFocusFlashId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [thankedIds, setThankedIds] = useState<Set<string>>(() => new Set());
  const [thankingId, setThankingId] = useState<string | null>(null);
  const [thankError, setThankError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const tippable = planAllowsPrize(plan);
  const resolvedPrize = resolveWorkPrizeYen(plan, prizeYen);
  const prizeLabel = resolvedPrize ? formatYen(resolvedPrize) : null;

  const threads = useMemo(() => buildThreads(comments), [comments]);
  const byId = useMemo(
    () => new Map(comments.map((c) => [c.id, c])),
    [comments],
  );

  useEffect(() => {
    const fromComments = comments.filter((c) => c.thanked).map((c) => c.id);
    const local = readLocalThanks(workId);
    setThankedIds(new Set([...fromComments, ...local]));
  }, [comments, workId]);

  /** 通知などから ?c= で来たとき、該当コメントを開いてスクロール＋ハイライト */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const focusId = new URLSearchParams(window.location.search).get("c");
    if (!focusId) return;
    if (!comments.some((c) => c.id === focusId)) return;
    setOpenId(focusId);
    setFocusFlashId(focusId);

    let tries = 0;
    const tryScroll = () => {
      const el = document.getElementById(`comment-${focusId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }
      return false;
    };
    const timer = window.setInterval(() => {
      tries += 1;
      if (tryScroll() || tries >= 8) {
        window.clearInterval(timer);
      }
    }, 80);
    const clearFlash = window.setTimeout(() => setFocusFlashId(null), 2800);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(clearFlash);
    };
  }, [comments]);

  useEffect(() => {
    if (!replyToId) return;
    setOpenId(replyToId);
  }, [replyToId]);

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
        body: JSON.stringify({ commentId, workId }),
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

  function renderActions(c: Comment, isRoot: boolean) {
    const neon = isNeonCommentId(c.id);
    const isCommentAuthor = Boolean(me) && me === normHandle(c.author);
    const canPayLive =
      tippable &&
      Boolean(resolvedPrize) &&
      isRoot &&
      isSeeder &&
      !isCommentAuthor &&
      neon &&
      !c.tipped &&
      !c.afterClose &&
      status !== "none" &&
      status !== "closed";
    const isThanked = Boolean(c.thanked) || thankedIds.has(c.id);
    const canThank = isSeeder && !isCommentAuthor && !isThanked;
    const showSeederDemoPrize =
      tippable &&
      Boolean(prizeLabel) &&
      isRoot &&
      isSeeder &&
      !isCommentAuthor &&
      !c.adopted &&
      !c.afterClose &&
      !neon &&
      status !== "none" &&
      status !== "closed";
    const showSeederDemoPayHint =
      tippable &&
      Boolean(prizeLabel) &&
      isRoot &&
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
    const showReply =
      Boolean(canReply && onReply) && !isDemoCommentId(c.id);

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {c.afterClose && isRoot && (
          <span className="rounded border border-viscum-line px-2 py-0.5 text-[11px] text-viscum-muted">
            終了後コメント（このラウンドの褒賞対象外）
          </span>
        )}

        {showReply && (
          <button
            type="button"
            className="rounded-md border border-viscum-line bg-white px-2.5 py-1 text-[11px] font-medium text-viscum-ink hover:border-viscum-brand hover:text-viscum-brand"
            onClick={(e) => {
              e.stopPropagation();
              onReply?.(c);
            }}
          >
            返信
          </button>
        )}

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
        {showSeederDemoPrize && prizeLabel && (
          <span className="rounded bg-viscum-berry px-2 py-0.5 text-[11px] text-white">
            褒賞 {prizeLabel}
          </span>
        )}

        {canPayLive && prizeLabel && (
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

        {showSeederDemoPayHint && prizeLabel && (
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

        {c.tipped && (
          <>
            <span className="rounded border border-viscum-berry/40 bg-viscum-berry/10 px-2 py-0.5 text-[11px] font-medium text-viscum-berry-deep">
              褒賞支払い済み{" "}
              {formatYen(c.tipYen ?? resolvedPrize ?? 0)}
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
    );
  }

  function renderRow(c: Comment, opts: { nested?: boolean; isRoot: boolean }) {
    const open = openId === c.id;
    const quoted =
      c.parentId && byId.has(c.parentId) ? byId.get(c.parentId)! : null;
    const quotedHandle = quoted
      ? quoted.author.replace(/^@/, "").trim()
      : "";
    return (
      <li
        key={c.id}
        id={`comment-${c.id}`}
        className={[
          opts.nested ? "border-t border-viscum-line/60 bg-viscum-paper-2/40" : "",
          focusFlashId === c.id
            ? "ring-2 ring-viscum-berry/50 ring-inset bg-viscum-berry/5"
            : "",
        ]
          .filter(Boolean)
          .join(" ") || undefined}
      >
        <button
          type="button"
          onClick={() => setOpenId(open ? null : c.id)}
          className={`flex w-full items-start gap-2 px-3 py-3 text-left transition ${
            opts.nested ? "pl-8" : ""
          } ${open ? "bg-viscum-bark-soft/60" : "hover:bg-viscum-paper-2/80"}`}
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
              {opts.nested ? (
                <span className="rounded bg-viscum-paper-2 px-1.5 py-0.5 text-[10px] font-medium text-viscum-muted">
                  返信
                </span>
              ) : null}
              {c.attitude ? (
                <span
                  className="inline-flex shrink-0"
                  title={
                    [
                      PROTOCOL_COLORS.find((p) => p.id === c.attitude)?.label,
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
              {(Boolean(c.thanked) || thankedIds.has(c.id)) && (
                <span className="rounded bg-viscum-moss/20 px-1.5 py-0.5 text-[10px] font-medium text-viscum-trunk">
                  お礼済み
                </span>
              )}
              {c.adopted && (
                <span className="rounded bg-viscum-leaf-soft px-1.5 py-0.5 text-[10px] font-medium text-viscum-leaf-deep">
                  選出
                </span>
              )}
              {c.afterClose && opts.isRoot && (
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
              <span> · {formatCommentStamp(c.createdAtIso, c.hoursAgo)}</span>
              {!open && quoted && (
                <>
                  <span className="text-viscum-line"> · </span>
                  <span className="line-clamp-1 font-normal text-viscum-trunk/80">
                    ↪ @{quotedHandle}: {quotePreview(quoted)}
                  </span>
                </>
              )}
              {!open && !quoted && (
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
          <div
            className={`border-t border-viscum-line/80 bg-viscum-paper px-3 py-3 ${
              opts.nested ? "pl-12" : "pl-9"
            }`}
          >
            {quoted ? (
              <blockquote className="mb-3 rounded-md border border-viscum-line/80 border-l-[3px] border-l-viscum-moss bg-viscum-paper-2/70 px-2.5 py-2 text-[12px] leading-snug text-viscum-ink">
                <p className="font-medium text-viscum-leaf-deep">
                  @{quotedHandle} への返信
                </p>
                <p className="mt-1 line-clamp-3 text-viscum-muted">
                  {quotePreview(quoted)}
                </p>
                <button
                  type="button"
                  className="mt-1.5 text-[11px] text-viscum-brand underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenId(quoted.id);
                    window.setTimeout(() => {
                      document
                        .getElementById(`comment-${quoted.id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 40);
                  }}
                >
                  元のコメントを見る
                </button>
              </blockquote>
            ) : null}
            <CommentBody body={c.body} imageUrls={c.imageUrls} />
            {renderActions(c, opts.isRoot)}
          </div>
        )}
      </li>
    );
  }

  return (
    <section className="border-t border-viscum-line pt-4" aria-label="コメント">
      <h2 className="text-[20px] font-bold text-viscum-ink">
        コメント · {comments.length}件
      </h2>
      <p className="mt-1 text-[11px] text-viscum-muted">
        件名をタップして本文を展開（Gmail型）· 返信は1段まで
        {isSeeder
          ? tippable
            ? " · お礼・褒賞の操作はこの画面のシーダーだけが使えます"
            : " · お礼はこの画面のシーダーだけが使えます（無料コメントに褒賞はありません）"
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
        {threads.flatMap(({ root, replies }) => {
          const rows: ReactNode[] = [];
          const pushRow = (c: Comment, opts: { nested?: boolean; isRoot: boolean }) => {
            rows.push(renderRow(c, opts));
            if (replyToId === c.id && replyCompose) {
              rows.push(
                <li
                  key={`compose-${c.id}`}
                  id="work-comment-compose"
                  className="border-t border-viscum-moss/40 bg-viscum-leaf-soft/30 px-3 py-3 pl-9"
                >
                  {replyCompose}
                </li>,
              );
            }
          };
          pushRow(root, { isRoot: true });
          for (const r of replies) {
            pushRow(r, { nested: true, isRoot: false });
          }
          return rows;
        })}
      </ul>
    </section>
  );
}
