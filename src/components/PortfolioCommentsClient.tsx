"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { PortfolioWallPost } from "@/data/dummy-portfolio-wall";
import { formatHoursAgo } from "@/data/dummy-works";
import { LinkifiedText } from "@/components/LinkifiedText";
import {
  addLocalPortfolioWallPost,
  readLocalPortfolioWall,
} from "@/lib/local-portfolio-wall";
import { accountLabelForHandle } from "@/data/suggested-seeders";
import {
  fetchRemoteProfile,
  readLocalProfile,
} from "@/lib/local-profile";

type Thread = {
  root: PortfolioWallPost;
  replies: PortfolioWallPost[];
};

function resolveOwnerDisplayName(handle: string): string {
  const key = handle.replace(/^@/, "").trim();
  const demo = accountLabelForHandle(key);
  const local = readLocalProfile(key)?.accountName?.trim();
  if (local) return local;
  if (
    demo.accountName &&
    demo.accountName.toLowerCase() !== key.toLowerCase()
  ) {
    return demo.accountName;
  }
  return key;
}

/** 1段返信のみ。返信への返信もルート直下に付ける */
function buildThreads(posts: PortfolioWallPost[]): Thread[] {
  const byId = new Map(posts.map((p) => [p.id, p]));

  function rootIdOf(p: PortfolioWallPost): string {
    if (!p.parentId || !byId.has(p.parentId)) return p.id;
    const parent = byId.get(p.parentId)!;
    if (!parent.parentId || !byId.has(parent.parentId)) return parent.id;
    return parent.parentId;
  }

  const roots = posts
    .filter((p) => !p.parentId || !byId.has(p.parentId))
    .sort((a, b) => a.hoursAgo - b.hoursAgo);

  const rootIdSet = new Set(roots.map((r) => r.id));

  const repliesByRoot = new Map<string, PortfolioWallPost[]>();
  for (const p of posts) {
    if (!p.parentId || !byId.has(p.parentId)) continue;
    const rid = rootIdOf(p);
    if (!rootIdSet.has(rid)) continue;
    const list = repliesByRoot.get(rid) ?? [];
    list.push(p);
    repliesByRoot.set(rid, list);
  }

  return roots.map((root) => ({
    root,
    replies: (repliesByRoot.get(root.id) ?? []).sort(
      (a, b) => a.hoursAgo - b.hoursAgo,
    ),
  }));
}

export function PortfolioCommentsClient({
  handle,
  initialPosts,
}: {
  handle: string;
  initialPosts: PortfolioWallPost[];
}) {
  const { data: session, status } = useSession();
  const [local, setLocal] = useState<PortfolioWallPost[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<PortfolioWallPost | null>(null);
  const [body, setBody] = useState("");
  const [ownerName, setOwnerName] = useState(() =>
    resolveOwnerDisplayName(handle),
  );

  useEffect(() => {
    setLocal(readLocalPortfolioWall(handle));
    setOwnerName(resolveOwnerDisplayName(handle));
    let cancelled = false;
    void fetchRemoteProfile(handle).then((remote) => {
      if (cancelled || !remote?.persisted) return;
      const n = remote.accountName?.trim();
      if (n) setOwnerName(n);
    });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const ownerLabel = ownerName.trim() || handle.replace(/^@/, "");
  const commentCta = `「${ownerLabel}」にコメントする`;
  const commentHeading = `「${ownerLabel}」へのコメント`;
  const loginCta = `ログインして「${ownerLabel}」にコメント`;
  const emptyCopy = `まだ「${ownerLabel}」へのコメントはありません。`;
  const placeholderNew = `「${ownerLabel}」にコメントを書く…`;

  const posts = useMemo(() => {
    const ids = new Set(local.map((p) => p.id));
    return [...local, ...initialPosts.filter((p) => !ids.has(p.id))];
  }, [local, initialPosts]);

  const threads = useMemo(() => buildThreads(posts), [posts]);
  const commentCount = posts.length;

  const loggedIn = status === "authenticated" && !!session?.user?.handle;
  const myHandle = session?.user?.handle?.replace(/^@/, "") ?? "";
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/u/${handle}`)}`;

  function resolveRoot(target: PortfolioWallPost): PortfolioWallPost {
    if (!target.parentId) return target;
    const parent = posts.find((p) => p.id === target.parentId);
    if (!parent) return target;
    if (!parent.parentId) return parent;
    return posts.find((p) => p.id === parent.parentId) ?? parent;
  }

  function openNew() {
    setReplyTo(null);
    setBody("");
    setComposeOpen(true);
  }

  function openReply(target: PortfolioWallPost) {
    if (!loggedIn) return;
    const root = resolveRoot(target);
    setReplyTo(root);
    setBody(`@${target.author} `);
    setComposeOpen(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedIn || !body.trim()) return;
    addLocalPortfolioWallPost(handle, {
      author: myHandle,
      body,
      parentId: replyTo?.id,
    });
    setBody("");
    setReplyTo(null);
    setComposeOpen(false);
    setLocal(readLocalPortfolioWall(handle));
  }

  function CommentBody({
    p,
    indented,
  }: {
    p: PortfolioWallPost;
    indented?: boolean;
  }) {
    return (
      <div
        className={`px-4 py-3 ${
          indented
            ? "ml-3 border-l-2 border-viscum-line bg-viscum-paper-2/40"
            : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {(() => {
            const raw = p.author.replace(/^@/, "").trim();
            const label = accountLabelForHandle(raw);
            const localName = readLocalProfile(raw)?.accountName?.trim();
            const name =
              localName ||
              (label.accountName.toLowerCase() !== raw.toLowerCase()
                ? label.accountName
                : "");
            const text = name ? `${name} @${raw}` : `@${raw}`;
            return (
              <Link
                href={`/u/${encodeURIComponent(raw)}`}
                className="text-[13px] font-medium text-viscum-trunk underline decoration-viscum-line underline-offset-2 hover:text-viscum-brand hover:decoration-viscum-brand"
              >
                {text}
              </Link>
            );
          })()}
          <span className="text-[11px] text-viscum-muted">
            {formatHoursAgo(p.hoursAgo)}
          </span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
          <LinkifiedText text={p.body} />
        </p>
        {loggedIn ? (
          <button
            type="button"
            onClick={() => openReply(p)}
            className="mt-1.5 text-[11px] font-medium text-viscum-brand hover:underline"
          >
            返信
          </button>
        ) : (
          <Link
            href={loginHref}
            className="mt-1.5 inline-block text-[11px] font-medium text-viscum-brand hover:underline"
          >
            ログインして返信
          </Link>
        )}
      </div>
    );
  }

  return (
    <section
      className="border-b border-viscum-line"
      aria-label={`${ownerLabel}へのコメント`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2 px-4 pt-4">
        <div>
          <p className="text-[20px] font-bold text-viscum-ink">
            {commentHeading} · {commentCount}件
          </p>
          <p className="mt-1 max-w-md text-[11px] leading-snug text-viscum-muted">
            ログインしたコテハンのみ。返信は1段まで。全文公開（自浄）。運営は原則裁定しません（デモ）。作品への反応とは別です。
          </p>
        </div>
        {loggedIn ? (
          <button
            type="button"
            onClick={() => {
              if (composeOpen && !replyTo) setComposeOpen(false);
              else openNew();
            }}
            className="shrink-0 rounded-md border border-viscum-line bg-viscum-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-viscum-ink hover:border-viscum-brand"
          >
            {composeOpen && !replyTo ? "閉じる" : commentCta}
          </button>
        ) : (
          <Link
            href={loginHref}
            className="shrink-0 rounded-md border border-viscum-line bg-viscum-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-viscum-ink hover:border-viscum-brand"
          >
            {status === "loading" ? "…" : loginCta}
          </Link>
        )}
      </div>

      {composeOpen && loggedIn && (
        <form
          onSubmit={onSubmit}
          className="mx-4 mt-3 space-y-2 rounded-lg border border-viscum-line bg-viscum-paper-2/60 px-3 py-3"
        >
          <p className="text-[12px] text-viscum-ink">
            投稿者 <span className="font-medium">@{myHandle}</span>
            <span className="ml-1 text-viscum-muted">（コテハン）</span>
            {replyTo && (
              <span className="ml-2 text-viscum-muted">
                → @{replyTo.author} への返信
                <button
                  type="button"
                  className="ml-1 text-viscum-brand hover:underline"
                  onClick={() => {
                    setReplyTo(null);
                    setBody("");
                  }}
                >
                  解除
                </button>
              </span>
            )}
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={replyTo ? "返信を書く…" : placeholderNew}
            className="w-full resize-y rounded border border-viscum-line bg-white px-2 py-1.5 text-[13px] leading-relaxed"
          />
          <button
            type="submit"
            disabled={!body.trim()}
            className="rounded-md bg-viscum-brand px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
          >
            {replyTo ? "返信する（デモ）" : "投稿する（デモ・端末内）"}
          </button>
        </form>
      )}

      {threads.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-viscum-muted">
          {emptyCopy}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-viscum-line border-t border-viscum-line">
          {threads.map(({ root, replies }) => (
            <li key={root.id}>
              <CommentBody p={root} />
              {replies.map((r) => (
                <CommentBody key={r.id} p={r} indented />
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
