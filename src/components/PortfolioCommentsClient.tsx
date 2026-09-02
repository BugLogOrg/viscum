"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { PortfolioWallPost } from "@/data/dummy-portfolio-wall";
import { formatCommentStamp } from "@/data/dummy-works";
import { LinkifiedText } from "@/components/LinkifiedText";
import {
  clearLocalPortfolioWall,
  readLocalPortfolioWall,
} from "@/lib/local-portfolio-wall";
import {
  fetchPortfolioWall,
  postPortfolioWall,
  deletePortfolioWallPost,
} from "@/lib/remote-portfolio-wall";
import { accountLabelForHandle } from "@/data/suggested-seeders";
import {
  fetchRemoteProfile,
  readLocalProfile,
} from "@/lib/local-profile";

type Thread = {
  root: PortfolioWallPost;
  replies: PortfolioWallPost[];
};

const NEON_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function postTimeMs(p: PortfolioWallPost): number {
  if (p.createdAtIso) {
    const t = Date.parse(p.createdAtIso);
    if (!Number.isNaN(t)) return t;
  }
  return Date.now() - p.hoursAgo * 3_600_000;
}

function authorLabel(author: string): string {
  const raw = author.replace(/^@/, "").trim();
  const label = accountLabelForHandle(raw);
  const localName = readLocalProfile(raw)?.accountName?.trim();
  const name =
    localName ||
    (label.accountName.toLowerCase() !== raw.toLowerCase()
      ? label.accountName
      : "");
  return name ? `${name} @${raw}` : `@${raw}`;
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
    .sort((a, b) => postTimeMs(b) - postTimeMs(a));

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
      (a, b) => postTimeMs(a) - postTimeMs(b),
    ),
  }));
}

/** 親内に定義すると入力のたびに再マウントして1文字しか打てなくなる */
function WallComposeForm({
  mode,
  myHandle,
  replyAuthor,
  body,
  submitting,
  placeholderNew,
  onBodyChange,
  onSubmit,
  onClose,
}: {
  mode: "new" | "reply";
  myHandle: string;
  replyAuthor?: string;
  body: string;
  submitting: boolean;
  placeholderNew: string;
  onBodyChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <form
      id={mode === "reply" ? "pf-wall-compose" : "pf-wall-compose-new"}
      onSubmit={onSubmit}
      className="space-y-2 rounded-lg border border-viscum-line bg-viscum-paper-2/60 px-3 py-3"
    >
      <p className="text-[12px] text-viscum-ink">
        投稿者 <span className="font-medium">@{myHandle}</span>
        <span className="ml-1 text-viscum-muted">（コテハン）</span>
        {replyAuthor && mode === "reply" && (
          <span className="ml-2 text-viscum-muted">
            → @{replyAuthor} への返信
            <button
              type="button"
              className="ml-1 text-viscum-brand hover:underline"
              onClick={onClose}
            >
              閉じる
            </button>
          </span>
        )}
      </p>
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        rows={3}
        placeholder={mode === "reply" ? "返信を書く…" : placeholderNew}
        className="w-full resize-y rounded border border-viscum-line bg-white px-2 py-1.5 text-[13px] leading-relaxed"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="rounded-md bg-viscum-brand px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
        >
          {submitting
            ? "保存中…"
            : mode === "reply"
              ? "返信する"
              : "投稿する"}
        </button>
        {mode === "new" && (
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-viscum-muted hover:underline"
          >
            閉じる
          </button>
        )}
      </div>
    </form>
  );
}

function WallCommentBody({
  p,
  indented,
  focusId,
  loggedIn,
  myHandle,
  loginHref,
  showReplyCompose,
  deletingId,
  compose,
  onToggleReply,
  onDelete,
}: {
  p: PortfolioWallPost;
  indented?: boolean;
  focusId: string | null;
  loggedIn: boolean;
  myHandle: string;
  loginHref: string;
  showReplyCompose: boolean;
  deletingId: string | null;
  compose: React.ReactNode;
  onToggleReply: () => void;
  onDelete: () => void;
}) {
  const isMine =
    loggedIn &&
    myHandle.toLowerCase() === p.author.replace(/^@/, "").toLowerCase();
  const raw = p.author.replace(/^@/, "").trim();

  return (
    <div>
      <div
        id={`pf-wall-${p.id}`}
        className={`px-4 py-3 ${
          indented
            ? "ml-3 border-l-2 border-viscum-line bg-viscum-paper-2/40"
            : ""
        } ${
          focusId === p.id
            ? "ring-2 ring-viscum-berry/50 ring-inset bg-viscum-berry/5"
            : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/u/${encodeURIComponent(raw)}`}
            className="text-[13px] font-medium text-viscum-trunk underline decoration-viscum-line underline-offset-2 hover:text-viscum-brand hover:decoration-viscum-brand"
          >
            {authorLabel(p.author)}
          </Link>
          <span className="text-[11px] text-viscum-muted">
            {formatCommentStamp(p.createdAtIso, p.hoursAgo)}
          </span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
          <LinkifiedText text={p.body} />
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {loggedIn ? (
            <button
              type="button"
              onClick={onToggleReply}
              className="text-[11px] font-medium text-viscum-brand hover:underline"
            >
              {showReplyCompose ? "閉じる" : "返信"}
            </button>
          ) : (
            <Link
              href={loginHref}
              className="text-[11px] font-medium text-viscum-brand hover:underline"
            >
              ログインして返信
            </Link>
          )}
          {isMine && (
            <button
              type="button"
              disabled={deletingId === p.id}
              onClick={onDelete}
              className="text-[11px] font-medium text-viscum-muted hover:text-viscum-berry-deep hover:underline disabled:opacity-60"
            >
              {deletingId === p.id ? "削除中…" : "削除"}
            </button>
          )}
        </div>
      </div>
      {showReplyCompose && loggedIn && (
        <div className="border-t border-viscum-moss/40 bg-viscum-leaf-soft/30 px-4 py-3 pl-7">
          {compose}
        </div>
      )}
    </div>
  );
}

export function PortfolioCommentsClient({
  handle,
  initialPosts,
  initialPersisted = false,
}: {
  handle: string;
  initialPosts: PortfolioWallPost[];
  /** サーバで Neon 正本を取れたか。取れていれば初回から一覧を出す */
  initialPersisted?: boolean;
}) {
  const { data: session, status } = useSession();
  const [local, setLocal] = useState<PortfolioWallPost[]>([]);
  const [remote, setRemote] = useState<PortfolioWallPost[]>(() =>
    initialPersisted ? initialPosts : [],
  );
  const [wallReady, setWallReady] = useState(
    () => initialPersisted || initialPosts.length > 0,
  );
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<PortfolioWallPost | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState(() =>
    resolveOwnerDisplayName(handle),
  );

  useEffect(() => {
    if (initialPersisted) {
      setRemote(initialPosts);
      setLocal([]);
      setWallReady(true);
    } else {
      setRemote([]);
      setWallReady(initialPosts.length > 0);
    }
    setPostError(null);
    setOwnerName(resolveOwnerDisplayName(handle));
    let cancelled = false;
    void fetchRemoteProfile(handle).then((r) => {
      if (cancelled || !r?.persisted) return;
      const n = r.accountName?.trim();
      if (n) setOwnerName(n);
    });
    if (initialPersisted) {
      return () => {
        cancelled = true;
      };
    }
    void fetchPortfolioWall(handle).then((res) => {
      if (cancelled) return;
      if (res.persisted) {
        clearLocalPortfolioWall(handle);
        setLocal([]);
        setRemote(res.posts);
        setWallReady(true);
        return;
      }
      setLocal(readLocalPortfolioWall(handle));
      setRemote([]);
      setWallReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, initialPersisted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("pw");
    if (!id) return;
    setFocusId(id);
  }, [handle]);

  useEffect(() => {
    if (!focusId) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`pf-wall-${focusId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
    const clear = window.setTimeout(() => setFocusId(null), 2800);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clear);
    };
  }, [focusId, remote, local]);

  useEffect(() => {
    if (!composeOpen || !replyTo) return;
    const t = window.setTimeout(() => {
      document.getElementById("pf-wall-compose")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      document
        .querySelector<HTMLTextAreaElement>("#pf-wall-compose textarea")
        ?.focus();
    }, 80);
    return () => window.clearTimeout(t);
  }, [composeOpen, replyTo]);

  const ownerLabel = ownerName.trim() || handle.replace(/^@/, "");
  const commentCta = `「${ownerLabel}」にコメントする`;
  const commentHeading = `「${ownerLabel}」へのコメント`;
  const loginCta = `ログインして「${ownerLabel}」にコメント`;
  const emptyCopy = `まだ「${ownerLabel}」へのコメントはありません。`;
  const placeholderNew = `「${ownerLabel}」にコメントを書く…`;

  const posts = useMemo(() => {
    const map = new Map<string, PortfolioWallPost>();
    if (initialPersisted) {
      for (const p of initialPosts) map.set(p.id, p);
    } else if (remote.length === 0) {
      for (const p of initialPosts) map.set(p.id, p);
    }
    for (const p of local) map.set(p.id, p);
    for (const p of remote) map.set(p.id, p);
    return [...map.values()];
  }, [local, remote, initialPosts, initialPersisted]);

  const threads = useMemo(() => buildThreads(posts), [posts]);
  const commentCount = posts.length;

  const loggedIn = status === "authenticated" && !!session?.user?.handle;
  const myHandle = session?.user?.handle?.replace(/^@/, "") ?? "";
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/u/${handle}`)}`;

  function openNew() {
    setReplyTo(null);
    setBody("");
    setPostError(null);
    setComposeOpen(true);
  }

  function openReply(target: PortfolioWallPost) {
    if (!loggedIn) return;
    setReplyTo(target);
    setBody("");
    setPostError(null);
    setComposeOpen(true);
  }

  function closeCompose() {
    setComposeOpen(false);
    setReplyTo(null);
    setBody("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedIn || !body.trim() || submitting) return;
    setSubmitting(true);
    setPostError(null);
    try {
      const parentId =
        replyTo && !replyTo.id.startsWith("local_wall_")
          ? replyTo.id
          : undefined;
      if (replyTo?.id.startsWith("local_wall_")) {
        setPostError(
          "古い端末内コメントへの返信はできません。新しいコメントとして書き直してください。",
        );
        return;
      }
      const remoteRes = await postPortfolioWall({
        handle,
        body: body.trim(),
        parentId,
      });
      if (remoteRes.ok && remoteRes.post) {
        clearLocalPortfolioWall(handle);
        setLocal([]);
        setRemote((prev) => [remoteRes.post!, ...prev]);
        closeCompose();
        return;
      }
      setPostError(
        remoteRes.error ||
          "保存に失敗しました。通信とログイン状態を確認してください。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function startDelete(p: PortfolioWallPost) {
    if (!window.confirm("このコメントを削除しますか？元に戻せません。")) {
      return;
    }
    setPostError(null);
    setDeletingId(p.id);
    try {
      if (!NEON_ID.test(p.id)) {
        setPostError("このコメントは削除できません");
        return;
      }
      const res = await deletePortfolioWallPost(p.id);
      if (!res.ok) {
        setPostError(res.error || "削除に失敗しました");
        return;
      }
      setRemote((prev) => prev.filter((x) => x.id !== p.id));
      setLocal((prev) => prev.filter((x) => x.id !== p.id));
      if (replyTo?.id === p.id) closeCompose();
    } finally {
      setDeletingId(null);
    }
  }

  const showTopCompose = composeOpen && loggedIn && !replyTo;

  const replyCompose = (
    <WallComposeForm
      mode="reply"
      myHandle={myHandle}
      replyAuthor={replyTo?.author}
      body={body}
      submitting={submitting}
      placeholderNew={placeholderNew}
      onBodyChange={setBody}
      onSubmit={onSubmit}
      onClose={closeCompose}
    />
  );

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
              if (showTopCompose) closeCompose();
              else openNew();
            }}
            className="shrink-0 rounded-md border border-viscum-line bg-viscum-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-viscum-ink hover:border-viscum-brand"
          >
            {showTopCompose ? "閉じる" : commentCta}
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

      {postError && (
        <p className="mx-4 mt-3 rounded-md border border-viscum-berry/40 bg-viscum-berry/10 px-3 py-2 text-[12px] text-viscum-berry-deep">
          {postError}
        </p>
      )}

      {showTopCompose && (
        <div className="mx-4 mt-3">
          <WallComposeForm
            mode="new"
            myHandle={myHandle}
            body={body}
            submitting={submitting}
            placeholderNew={placeholderNew}
            onBodyChange={setBody}
            onSubmit={onSubmit}
            onClose={closeCompose}
          />
        </div>
      )}

      {threads.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-viscum-muted">
          {!wallReady ? "コメントを読み込み中…" : emptyCopy}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-viscum-line border-t border-viscum-line">
          {threads.map(({ root, replies }) => (
            <li key={root.id}>
              <WallCommentBody
                p={root}
                focusId={focusId}
                loggedIn={loggedIn}
                myHandle={myHandle}
                loginHref={loginHref}
                showReplyCompose={composeOpen && replyTo?.id === root.id}
                deletingId={deletingId}
                compose={replyCompose}
                onToggleReply={() => {
                  if (composeOpen && replyTo?.id === root.id) closeCompose();
                  else openReply(root);
                }}
                onDelete={() => void startDelete(root)}
              />
              {replies.map((r) => (
                <WallCommentBody
                  key={r.id}
                  p={r}
                  indented
                  focusId={focusId}
                  loggedIn={loggedIn}
                  myHandle={myHandle}
                  loginHref={loginHref}
                  showReplyCompose={composeOpen && replyTo?.id === r.id}
                  deletingId={deletingId}
                  compose={replyCompose}
                  onToggleReply={() => {
                    if (composeOpen && replyTo?.id === r.id) closeCompose();
                    else openReply(r);
                  }}
                  onDelete={() => void startDelete(r)}
                />
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
