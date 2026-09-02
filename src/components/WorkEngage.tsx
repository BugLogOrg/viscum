"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { CommentList } from "@/components/CommentList";
import { CommentAttitudePicker } from "@/components/CommentAttitudePicker";
import { StatusBadge } from "@/components/StatusBadge";
import {
  type Comment,
  type CompStatus,
  type DemoSeedPlan,
  formatYen,
} from "@/data/dummy-works";
import {
  addLocalComment,
  readLocalComments,
} from "@/lib/local-comments";
import { withLocalThanks } from "@/lib/local-thanks";
import {
  fetchWorkComments,
  postWorkComment,
} from "@/lib/remote-comments";
import type { CommentAttitudeId } from "@/lib/protocol-colors";
import {
  countImagesInBlocks,
  emptyComposeBlocks,
  newBlockId,
  serializeCommentBlocks,
  type CommentBlock,
  type CommentImageBlock,
} from "@/lib/comment-blocks";
import { MAX_COMMENT_IMAGES } from "@/lib/comment-images";
import {
  fetchBlobConfigured,
  prepareCommentImage,
} from "@/lib/upload-comment-image";
import { resolveWorkPrizeYen } from "@/lib/work-prize";

type Props = {
  workId: string;
  seederHandle: string;
  status: CompStatus;
  prizeYen?: number;
  plan?: DemoSeedPlan | null;
  paymentsDone?: number;
  planLabel?: string | null;
  /** 「この作品への○○を募集しています」— プランから自動 */
  recruitPitch?: string | null;
  deadlineLine?: string | null;
  closesAtIso?: string | null;
  tags?: string[];
  initialComments: Comment[];
  hasAdoptedUntipped: boolean;
  scaffoldLabel?: string;
  scaffoldLines?: string[];
  /** 公開ブースト: 書いて報告する場所 */
  boostWriteUrl?: string;
};

/**
 * コンペ一塊（下に統合）＋コメント投稿＋一覧。
 * 投稿はログイン＋英語ID必須（ADR-027）。画像は文中ブロック。
 */
export function WorkEngage({
  workId,
  seederHandle,
  status,
  prizeYen,
  plan = null,
  paymentsDone,
  planLabel,
  recruitPitch = null,
  deadlineLine = null,
  closesAtIso = null,
  tags = [],
  initialComments,
  hasAdoptedUntipped,
  scaffoldLabel,
  scaffoldLines = [],
  boostWriteUrl,
}: Props) {
  const { data: session, status: authStatus } = useSession();
  const handle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";
  const canWrite = Boolean(session?.user?.id && handle);
  const displayPrizeYen = resolveWorkPrizeYen(plan, prizeYen) ?? undefined;

  const [localExtra, setLocalExtra] = useState<Comment[]>([]);
  const [remoteExtra, setRemoteExtra] = useState<Comment[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [openForm, setOpenForm] = useState(false);
  /** 返信先（表示用）。投稿時はルートIDへ正規化 */
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  /** 返信専用の地の文章（態度・画像なし） */
  const [replyBody, setReplyBody] = useState("");
  const [subject, setSubject] = useState("");
  const [attitude, setAttitude] = useState<CommentAttitudeId | null>(null);
  const [blocks, setBlocks] = useState<CommentBlock[]>(emptyComposeBlocks);
  const [error, setError] = useState<string | null>(null);
  const [justPosted, setJustPosted] = useState(false);
  const [lastPersisted, setLastPersisted] = useState<boolean | null>(null);
  const [blobOn, setBlobOn] = useState<boolean | null>(null);
  const [busyUpload, setBusyUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalExtra(readLocalComments(workId));
    setRemoteExtra([]);
    setRemovedIds(new Set());
    let cancelled = false;
    void fetchWorkComments(workId).then((res) => {
      if (cancelled) return;
      setRemoteExtra(res.comments);
    });
    return () => {
      cancelled = true;
    };
  }, [workId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const paymentId = params.get("payment");
    if (checkout !== "success" && checkout !== "cancel") return;

    void (async () => {
      if (checkout === "success" && paymentId) {
        try {
          await fetch("/api/checkout/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        } catch {
          /* webhook 側で拾える */
        }
      }
      const res = await fetchWorkComments(workId);
      setRemoteExtra(res.comments);
      if (checkout === "cancel") {
        setError("Checkout をキャンセルしました。未払いのままです。");
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.pathname + url.search);
    })();
  }, [workId]);

  useEffect(() => {
    void fetchBlobConfigured().then(setBlobOn);
  }, []);

  const comments = useMemo(() => {
    const seen = new Set<string>();
    const merged: Comment[] = [];
    for (const c of [...remoteExtra, ...localExtra, ...initialComments]) {
      if (removedIds.has(c.id)) continue;
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      merged.push(c);
    }
    return withLocalThanks(workId, merged);
  }, [remoteExtra, localExtra, initialComments, workId, removedIds]);

  const showCompBand =
    status === "open" || status === "pay_soon" || status === "closed";
  const compActive = status === "open" || status === "pay_soon";
  const compClosed = status === "closed";
  const canPost =
    status === "open" ||
    status === "pay_soon" ||
    status === "closed" ||
    status === "none";
  const seederNorm = seederHandle.replace(/^@/, "").trim().toLowerCase();
  const isSeederViewer = Boolean(handle && handle.toLowerCase() === seederNorm);

  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/w/${workId}`)}`;

  function startCompose() {
    if (!canWrite) {
      setOpenForm(true);
      setReplyTo(null);
      setError(null);
      return;
    }
    setReplyTo(null);
    setOpenForm(true);
    setJustPosted(false);
    setError(null);
  }

  function startReply(target: Comment) {
    if (!canWrite) {
      setOpenForm(true);
      setError(null);
      return;
    }
    // UI・parentId ともクリックしたコメント（引用の正本）。表示はルート直下にフラット
    setReplyTo(target);
    const re = target.subject.startsWith("Re:")
      ? target.subject
      : `Re: ${target.subject}`.slice(0, 80);
    setSubject(re);
    setReplyBody("");
    setAttitude(null);
    setOpenForm(true);
    setJustPosted(false);
    setError(null);
    window.setTimeout(() => {
      document.getElementById("work-comment-compose")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  }

  function resetForm() {
    setSubject("");
    setReplyBody("");
    setAttitude(null);
    setBlocks((prev) => {
      for (const b of prev) {
        if (b.type === "image" && b.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(b.previewUrl);
        }
      }
      return emptyComposeBlocks();
    });
  }

  function addTextBlockAfter(afterId?: string) {
    const block: CommentBlock = {
      id: newBlockId("t"),
      type: "text",
      text: "",
    };
    setBlocks((prev) => {
      if (!afterId) return [...prev, block];
      const i = prev.findIndex((b) => b.id === afterId);
      if (i < 0) return [...prev, block];
      const next = [...prev];
      next.splice(i + 1, 0, block);
      return next;
    });
  }

  async function addFilesAfter(
    fileList: FileList | File[],
    afterId: string | null,
  ) {
    if (!canWrite) {
      setError("画像の添付にはログインが必要です。");
      return;
    }
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!files.length) return;
    const used = countImagesInBlocks(blocks);
    const room = MAX_COMMENT_IMAGES - used;
    if (room <= 0) {
      setError(`画像は最大${MAX_COMMENT_IMAGES}枚までです`);
      return;
    }
    setBusyUpload(true);
    setError(null);
    try {
      let anchor = afterId;
      for (const file of files.slice(0, room)) {
        const id = newBlockId("img");
        const localPreview = URL.createObjectURL(file);
        const placeholder: CommentImageBlock = {
          id,
          type: "image",
          previewUrl: localPreview,
          caption: "",
          uploading: true,
        };
        setBlocks((prev) => {
          if (!anchor) return [...prev, placeholder];
          const i = prev.findIndex((b) => b.id === anchor);
          if (i < 0) return [...prev, placeholder];
          const next = [...prev];
          next.splice(i + 1, 0, placeholder);
          return next;
        });
        anchor = id;
        try {
          const prepared = await prepareCommentImage(file);
          URL.revokeObjectURL(localPreview);
          setBlocks((prev) =>
            prev.map((b) =>
              b.id === id && b.type === "image"
                ? {
                    ...b,
                    previewUrl: prepared.previewUrl,
                    finalUrl: prepared.finalUrl,
                    uploading: false,
                  }
                : b,
            ),
          );
        } catch (e) {
          URL.revokeObjectURL(localPreview);
          setBlocks((prev) =>
            prev.map((b) =>
              b.id === id && b.type === "image"
                ? {
                    ...b,
                    uploading: false,
                    error: (e as Error).message || "アップロード失敗",
                  }
                : b,
            ),
          );
        }
      }
    } finally {
      setBusyUpload(false);
      setInsertAfterId(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeBlock(id: string) {
    setBlocks((prev) => {
      const hit = prev.find((b) => b.id === id);
      if (hit?.type === "image" && hit.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(hit.previewUrl);
      }
      const next = prev.filter((b) => b.id !== id);
      return next.length ? next : emptyComposeBlocks();
    });
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[i]!;
      next[i] = next[j]!;
      next[j] = tmp;
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) {
      setError("コメントにはログインと英語ID（コテハン）が必要です。");
      return;
    }

    const isReply = Boolean(replyTo?.id);
    const accountName =
      session?.user?.name?.trim() &&
      session.user.name.trim().toLowerCase() !== handle.toLowerCase()
        ? session.user.name.trim()
        : undefined;

    if (isReply) {
      const text = replyBody.trim();
      if (!text) {
        setError("返信を書いてください。");
        return;
      }
      const s =
        subject.trim() ||
        (replyTo!.subject.startsWith("Re:")
          ? replyTo!.subject
          : `Re: ${replyTo!.subject}`.slice(0, 80));
      setSubmitting(true);
      setError(null);
      try {
        const parentId = replyTo!.id;
        const remote = await postWorkComment({
          workId,
          subject: s,
          body: text,
          imageUrls: [],
          afterClose: compClosed,
          parentId,
        });
        if (remote.ok && remote.comment) {
          setRemoteExtra((prev) => [remote.comment!, ...prev]);
          resetForm();
          setReplyTo(null);
          setOpenForm(false);
          setJustPosted(true);
          setLastPersisted(true);
          return;
        }
        addLocalComment(workId, {
          author: handle,
          accountName,
          subject: s,
          body: text,
          afterClose: compClosed,
          imageUrls: [],
          parentId,
        });
        setLocalExtra(readLocalComments(workId));
        resetForm();
        setReplyTo(null);
        setOpenForm(false);
        setJustPosted(true);
        setLastPersisted(false);
        if (remote.error) {
          setError(`${remote.error}（この端末には保存しました）`);
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const s = subject.trim();
    if (!s) {
      setError("件名を書いてください。");
      return;
    }
    if (!attitude) {
      setError("コメントの態度（緑／青／赤）を選んでください。");
      return;
    }
    if (blocks.some((b) => b.type === "image" && b.uploading)) {
      setError("画像のアップロードが終わるまで待ってください。");
      return;
    }
    if (blocks.some((b) => b.type === "image" && b.error)) {
      setError("失敗した画像を外すか、入れ直してください。");
      return;
    }
    const { body, imageUrls } = serializeCommentBlocks(blocks);
    if (!body.trim()) {
      setError("本文か画像を入れてください。");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const remote = await postWorkComment({
        workId,
        subject: s,
        body,
        imageUrls,
        afterClose: compClosed,
        attitude,
      });
      if (remote.ok && remote.comment) {
        setRemoteExtra((prev) => [remote.comment!, ...prev]);
        resetForm();
        setReplyTo(null);
        setOpenForm(false);
        setJustPosted(true);
        setLastPersisted(true);
        return;
      }
      // DB未接続など: 端末にフォールバック（他端末では見えない）
      addLocalComment(workId, {
        author: handle,
        accountName,
        subject: s,
        body,
        afterClose: compClosed,
        imageUrls,
        attitude,
      });
      setLocalExtra(readLocalComments(workId));
      resetForm();
      setReplyTo(null);
      setOpenForm(false);
      setJustPosted(true);
      setLastPersisted(false);
      if (remote.error) {
        setError(
          `${remote.error}（この端末には保存しました）`,
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function composeGate() {
    if (authStatus === "loading") {
      return (
        <p className="text-[13px] text-viscum-muted">ログイン状態を確認中…</p>
      );
    }
    if (!canWrite) {
      return (
        <div className="rounded-md border border-viscum-line bg-viscum-paper px-3 py-3 text-[13px] leading-relaxed text-viscum-ink">
          <p className="font-medium text-viscum-berry-deep">
            コメントはログイン必須です
          </p>
          <p className="mt-1 text-[12px] text-viscum-muted">
            英語ID（コテハン）が残るので、追跡と荒らし防止になります。表示名の自由入力はできません。
          </p>
          <Link
            href={loginHref}
            className="mt-3 inline-flex rounded-md bg-viscum-berry px-3 py-2 text-sm font-medium text-white hover:bg-viscum-berry-deep"
          >
            ログインして書く
          </Link>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-4">
      {showCompBand && (
        <div className="space-y-2 rounded-lg border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-3 text-sm">
          {recruitPitch && !compClosed ? (
            <p className="text-[14px] font-medium leading-snug text-viscum-ink">
              {recruitPitch}
            </p>
          ) : null}
          <StatusBadge
            status={status}
            prizeYen={displayPrizeYen}
            paymentsDone={paymentsDone}
            planLabel={planLabel ?? undefined}
            size="lg"
          />
          {deadlineLine ? (
            <p
              className={
                compClosed
                  ? "text-sm text-viscum-muted"
                  : "text-sm text-viscum-ink"
              }
            >
              <span className="text-viscum-muted">締切 </span>
              {closesAtIso && !compClosed ? (
                <>
                  <time dateTime={closesAtIso}>
                    {deadlineLine.replace(/（[^）]+）$/, "")}
                  </time>
                  <span className="font-medium text-viscum-berry-deep">
                    {deadlineLine.match(/（[^）]+）$/)?.[0] ?? ""}
                  </span>
                </>
              ) : (
                deadlineLine
              )}
            </p>
          ) : null}
          {displayPrizeYen ? (
            <p className="text-[13px] text-viscum-muted">
              褒賞は選ばれた人へ（{formatYen(displayPrizeYen)}）
            </p>
          ) : null}
          {status === "pay_soon" ? (
            <p className="text-[12px] text-viscum-muted">決済準備中</p>
          ) : null}
          {compClosed ? (
            <div
              className="rounded-md border border-viscum-bark bg-viscum-paper px-2.5 py-2 text-[12px] leading-relaxed text-viscum-ink"
              role="status"
            >
              <p className="font-semibold text-viscum-berry-deep">
                このコンペは締め切っています
              </p>
              <p className="mt-1 text-viscum-muted">
                このラウンドの褒賞対象にはなりません。再コンペの希望や、追加の感想・指摘のコメントは歓迎です。
              </p>
            </div>
          ) : null}
          {typeof paymentsDone === "number" && paymentsDone > 0 ? (
            <p className="text-[12px] text-viscum-muted">
              褒賞支払い完了 {paymentsDone}件
              {compClosed
                ? "。メンターはコメント展開先の「受け取る」から出金（デモ）。"
                : null}
            </p>
          ) : null}
          {compActive && hasAdoptedUntipped && displayPrizeYen ? (
            <p className="text-[12px] text-viscum-muted">
              {isSeederViewer
                ? "選出済み・褒賞の支払い待ち。コメントを展開 →「褒賞を渡す」で Checkout。"
                : "選出済み・褒賞の支払い待ちです。"}
            </p>
          ) : null}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="rounded-md border border-viscum-line bg-viscum-paper-2 px-2 py-0.5 text-[12px] text-viscum-trunk hover:border-viscum-brand hover:text-viscum-brand"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}
          {!openForm ? (
            <button
              type="button"
              onClick={startCompose}
              className="mt-1 w-full rounded-md bg-viscum-berry px-3 py-2 text-sm font-medium text-white hover:bg-viscum-berry-deep"
            >
              {compClosed
                ? "コメントする（コンペは終了）"
                : "参加してコメント"}
            </button>
          ) : null}
        </div>
      )}

      {!showCompBand && tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="rounded-md border border-viscum-line bg-viscum-paper-2 px-2 py-0.5 text-[12px] text-viscum-trunk hover:border-viscum-brand hover:text-viscum-brand"
            >
              {tag}
            </Link>
          ))}
        </div>
      ) : null}

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
          {compClosed ? "（終了後・賞金対象外）" : ""}
          {lastPersisted
            ? "。サーバーに保存され、他の人・他の端末からも見えます。"
            : "。いまはこの端末のみです。"}
        </p>
      )}

      {openForm && canPost && !replyTo && (
        <div
          id="work-comment-compose"
          className="space-y-3 rounded-lg border border-viscum-line bg-white/70 px-3 py-3"
        >
          <h3 className="text-[14px] font-semibold text-viscum-ink">
            {compClosed ? "終了後コメント" : "コメントを書く"}
          </h3>
          {composeGate()}
          {canWrite ? (
            <form onSubmit={submit} className="space-y-3">
              {compClosed && (
                <p className="text-[12px] leading-relaxed text-viscum-berry-deep">
                  締切済みのため、このコメントはコンペの賞金対象外です。
                </p>
              )}
              <p className="text-[11px] text-viscum-muted">
                投稿者: @{handle}
                {session?.user?.name &&
                session.user.name.trim().toLowerCase() !== handle.toLowerCase()
                  ? `（${session.user.name.trim()}）`
                  : ""}
                　· コテハン固定
              </p>
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

              <CommentAttitudePicker value={attitude} onChange={setAttitude} />

              {boostWriteUrl ? (
                <a
                  href={boostWriteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-viscum-berry/35 bg-viscum-berry/5 px-2.5 py-2 text-[12px] leading-snug text-viscum-ink transition hover:border-viscum-berry"
                >
                  <span className="font-medium text-viscum-berry-deep">
                    書いてほしい場所
                  </span>
                  <span className="mt-0.5 block truncate text-viscum-muted">
                    {boostWriteUrl}
                  </span>
                </a>
              ) : null}

              {scaffoldLabel && scaffoldLines.length > 0 && (
                <div className="space-y-2">
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
                  <p className="text-[13px] leading-relaxed text-viscum-muted">
                    入口として聞かれていることです。ここに書かれていないことでも、気づいたら書いて大丈夫です。
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[12px] text-viscum-muted">
                  本文（文章と画像を交互に置けます）
                </p>
                {blocks.map((b, index) => (
                  <div
                    key={b.id}
                    className="rounded-md border border-viscum-line bg-viscum-paper px-2.5 py-2"
                  >
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-medium tracking-wide text-viscum-muted">
                        {b.type === "text" ? "文章" : "画像"} · {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveBlock(b.id, -1)}
                        disabled={index === 0}
                        className="text-[11px] text-viscum-brand underline disabled:opacity-30"
                      >
                        上へ
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(b.id, 1)}
                        disabled={index === blocks.length - 1}
                        className="text-[11px] text-viscum-brand underline disabled:opacity-30"
                      >
                        下へ
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(b.id)}
                        className="ml-auto text-[11px] text-viscum-muted underline"
                      >
                        削除
                      </button>
                    </div>
                    {b.type === "text" ? (
                      <textarea
                        value={b.text}
                        onChange={(e) => {
                          const v = e.target.value;
                          setBlocks((prev) =>
                            prev.map((x) =>
                              x.id === b.id && x.type === "text"
                                ? { ...x, text: v }
                                : x,
                            ),
                          );
                        }}
                        onPaste={(e) => {
                          const items = e.clipboardData?.items;
                          if (!items) return;
                          const files: File[] = [];
                          for (const item of items) {
                            if (item.type.startsWith("image/")) {
                              const f = item.getAsFile();
                              if (f) files.push(f);
                            }
                          }
                          if (files.length) {
                            e.preventDefault();
                            void addFilesAfter(files, b.id);
                          }
                        }}
                        rows={4}
                        maxLength={4000}
                        placeholder="指摘を書く。画像を貼ると、この段落の直後に入ります"
                        className="w-full resize-y rounded-md border border-viscum-line bg-white/80 px-2.5 py-2 text-[14px] leading-relaxed text-viscum-ink outline-none focus:border-viscum-brand"
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="relative overflow-hidden rounded-md border border-viscum-line bg-viscum-paper-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={b.previewUrl}
                            alt=""
                            className="max-h-48 w-full object-contain"
                          />
                          {b.uploading && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[11px] text-white">
                              圧縮・送信中
                            </span>
                          )}
                          {b.error && (
                            <span className="absolute inset-x-0 bottom-0 bg-viscum-berry-deep/90 px-1 py-0.5 text-[10px] text-white">
                              {b.error}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={b.caption}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBlocks((prev) =>
                              prev.map((x) =>
                                x.id === b.id && x.type === "image"
                                  ? { ...x, caption: v }
                                  : x,
                              ),
                            );
                          }}
                          maxLength={80}
                          placeholder="この画像の一言（例: 設定が深い）"
                          className="w-full rounded-md border border-viscum-line bg-white/80 px-2.5 py-1.5 text-[13px] text-viscum-ink outline-none focus:border-viscum-brand"
                        />
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => addTextBlockAfter(b.id)}
                        className="text-[11px] font-medium text-viscum-brand underline"
                      >
                        ＋この下に文章
                      </button>
                      <button
                        type="button"
                        disabled={
                          busyUpload ||
                          countImagesInBlocks(blocks) >= MAX_COMMENT_IMAGES
                        }
                        onClick={() => {
                          setInsertAfterId(b.id);
                          fileRef.current?.click();
                        }}
                        className="text-[11px] font-medium text-viscum-brand underline disabled:opacity-40"
                      >
                        ＋この下に画像
                      </button>
                    </div>
                  </div>
                ))}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      void addFilesAfter(e.target.files, insertAfterId);
                    }
                  }}
                />
                <p className="text-[11px] leading-relaxed text-viscum-muted">
                  {blobOn === true
                    ? "画像は圧縮して Blob へ直送（課金なし枠）。文章の直後に差し込めます。"
                    : blobOn === false
                      ? "Blob 未接続時は端末内デモ。本番はトークン設定済み想定。"
                      : "保存先を確認中…"}
                </p>
              </div>

              {error && (
                <p className="text-[12px] text-viscum-berry-deep">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    busyUpload ||
                    !attitude ||
                    blocks.some((b) => b.type === "image" && b.uploading)
                  }
                  className="flex-1 rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                >
                  {submitting ? "保存中…" : "送信する"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenForm(false);
                    setReplyTo(null);
                    setError(null);
                    resetForm();
                  }}
                  className="rounded-md border border-viscum-line px-3 py-2.5 text-sm text-viscum-muted"
                >
                  やめる
                </button>
              </div>
            </form>
          ) : null}
          {!canWrite && (
            <button
              type="button"
              onClick={() => {
                setOpenForm(false);
                setReplyTo(null);
                setError(null);
              }}
              className="rounded-md border border-viscum-line px-3 py-2 text-sm text-viscum-muted"
            >
              閉じる
            </button>
          )}
        </div>
      )}

      <CommentList
        comments={comments}
        status={status}
        prizeYen={prizeYen}
        plan={plan}
        workId={workId}
        seederHandle={seederHandle}
        canReply={canWrite && canPost}
        onReply={startReply}
        replyToId={replyTo?.id ?? null}
        replyCompose={
          openForm && canPost && replyTo ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[14px] font-semibold text-viscum-ink">
                  返信を書く
                </h3>
                <p className="text-[11px] text-viscum-muted">
                  @{replyTo.author.replace(/^@/, "")} へ · 地の文章のみ（URL可）
                </p>
              </div>
              {composeGate()}
              {canWrite ? (
                <form onSubmit={submit} className="space-y-3">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={4}
                    maxLength={4000}
                    placeholder="返信を書く。http(s)のURLはそのまま貼れます"
                    className="w-full resize-y rounded-md border border-viscum-line bg-viscum-paper px-3 py-2 text-[14px] leading-relaxed text-viscum-ink outline-none focus:border-viscum-brand"
                    autoFocus
                  />
                  {error && (
                    <p className="text-[12px] text-viscum-berry-deep">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting || !replyBody.trim()}
                      className="flex-1 rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-50"
                    >
                      {submitting ? "保存中…" : "返信する"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenForm(false);
                        setReplyTo(null);
                        setError(null);
                        resetForm();
                      }}
                      className="rounded-md border border-viscum-line px-3 py-2.5 text-sm text-viscum-muted"
                    >
                      やめる
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null
        }
        onCommentDeleted={(commentId) => {
          setRemovedIds((prev) => new Set([...prev, commentId]));
          setLocalExtra((prev) => prev.filter((c) => c.id !== commentId));
          setRemoteExtra((prev) => prev.filter((c) => c.id !== commentId));
        }}
      />
    </div>
  );
}
