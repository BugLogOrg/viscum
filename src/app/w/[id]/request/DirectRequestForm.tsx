"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Work } from "@/data/dummy-works";
import { createRequestDm, formatRequestAmountLabel, coerceDirectRequestAmountYen, DIRECT_REQUEST_AMOUNT_PRESETS } from "@/lib/local-request-dms";
import { postRequestDm } from "@/lib/remote-requests";
import {
  displayAccountName,
  fetchRemoteProfile,
  listLocalProfiles,
  readLocalProfile,
} from "@/lib/local-profile";
import {
  FOLLOWS_UPDATED,
  isFollowing,
  listFollowing,
  rememberViewer,
} from "@/lib/local-follows";
import { isDemoSeed } from "@/lib/local-seeds";
import {
  accountLabelForHandle,
  getDemoSeederProfile,
} from "@/data/suggested-seeders";

type MentorOption = {
  handle: string;
  label: string;
  hint: string;
  mutual?: boolean;
  following?: boolean;
};

type Draft = {
  mentor: string;
  message: string;
  amountYen?: number;
  updatedAt: string;
};

type ShareTone = "internal" | "external";

/** 登録済みへ場内送信 vs 外DM・メールでリンク渡し */
type DeliveryMode = "in_app" | "outbound";

function draftKey(workId: string, fromHandle: string) {
  return `viscum_request_draft_v5:${workId}:${fromHandle.toLowerCase() || "anon"}`;
}

/** 作品タイトル由来の旧テンプレは復元しない */
function isStaleTemplatePitch(text: string, workTitle?: string) {
  const t = text.trim();
  if (!t) return false;
  if (
    t.includes("あなただけに見てほしいです") ||
    t.includes("見る範囲は説明どおりで大丈夫です")
  ) {
    return true;
  }
  // タイトル先頭をそのまま貼っただけもテンプレ扱い
  if (workTitle) {
    const head = workTitle.trim().slice(0, 24);
    if (head.length >= 12 && t.startsWith(head)) return true;
  }
  return false;
}

function optionFromHandle(
  handle: string,
  me: string,
): MentorOption {
  const key = handle.replace(/^@/, "").trim().toLowerCase();
  const profile = readLocalProfile(key);
  const label = displayAccountName(key, profile);
  const demo = accountLabelForHandle(key);
  const following = Boolean(me) && isFollowing(me, key);
  const mutual = following && isFollowing(key, me);
  const bio =
    profile?.bio?.trim() ||
    getDemoSeederProfile(key)?.bio?.trim() ||
    "";
  let hint = bio || "（自己紹介未設定）";
  if (mutual) hint = bio ? bio.slice(0, 80) : "相互フォロー";
  else if (following && !bio) hint = "フォロー中 · 自己紹介未設定";
  return {
    handle: key,
    label: label !== key ? label : demo.accountName,
    hint: hint.slice(0, 80),
    mutual,
    following,
  };
}

/** 未検索＝フォロー中のみ。検索＝フォロー一致＋ローカル／入力ID（デモ棚は出さない） */
function collectCandidates(me: string, query: string): MentorOption[] {
  const needle = query.trim().toLowerCase().replace(/^@/, "");
  const hit = new Map<string, MentorOption>();
  const put = (h: string) => {
    const key = h.replace(/^@/, "").trim().toLowerCase();
    if (!key || (me && key === me.toLowerCase())) return;
    const row = optionFromHandle(key, me);
    if (needle) {
      const label = row.label.toLowerCase();
      if (!key.includes(needle) && !label.includes(needle)) return;
    }
    if (!hit.has(key)) hit.set(key, row);
  };

  if (me) {
    for (const h of listFollowing(me)) put(h);
  }

  if (needle) {
    for (const p of listLocalProfiles()) put(p.handle);
    if (needle.length >= 2) put(needle);
  }

  const rows = [...hit.values()];
  rows.sort((a, b) => {
    const score = (m: MentorOption) =>
      (m.mutual ? 4 : 0) + (m.following ? 2 : 0);
    return score(b) - score(a) || a.handle.localeCompare(b.handle);
  });
  return rows.slice(0, 20);
}

export function DirectRequestForm({
  work,
  ensureWork,
  metaReady = true,
  showWorkCard = true,
}: {
  work: Work;
  /** 未保存ドラフトのとき、送信／外部コピー前に永続化して返す */
  ensureWork?: () => Promise<Work | null>;
  /** タイトル・URLなど必須が揃っているか（compose一枚用） */
  metaReady?: boolean;
  showWorkCard?: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const fromHandle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [mentor, setMentor] = useState("");
  const [message, setMessage] = useState("");
  const [amountYen, setAmountYen] = useState(() =>
    coerceDirectRequestAmountYen(work.prizeYen ?? 5000, 5000),
  );
  const [customAmount, setCustomAmount] = useState("");
  const [amountMode, setAmountMode] = useState<"preset" | "custom">(() => {
    const n = coerceDirectRequestAmountYen(work.prizeYen ?? 5000, 5000);
    return (DIRECT_REQUEST_AMOUNT_PRESETS as readonly number[]).includes(n)
      ? "preset"
      : "custom";
  });
  const [delivery, setDelivery] = useState<DeliveryMode>("outbound");
  const shareTone: ShareTone =
    delivery === "in_app" ? "internal" : "external";
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [remoteHint, setRemoteHint] = useState<MentorOption | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [invitePath, setInvitePath] = useState<string | null>(null);
  const [requestPath, setRequestPath] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [activeWork, setActiveWork] = useState(work);

  useEffect(() => {
    setActiveWork(work);
  }, [work]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (fromHandle) rememberViewer(fromHandle);
  }, [fromHandle]);

  useEffect(() => {
    const sync = () => setTick((n) => n + 1);
    window.addEventListener(FOLLOWS_UPDATED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FOLLOWS_UPDATED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // 下書き復元（v5）。タイトル由来テンプレは捨てる
  useEffect(() => {
    try {
      const base = `${work.id}:${fromHandle.toLowerCase() || "anon"}`;
      localStorage.removeItem(`viscum_request_draft_v1:${base}`);
      localStorage.removeItem(`viscum_request_draft_v2:${base}`);
      localStorage.removeItem(`viscum_request_draft_v3:${base}`);
      localStorage.removeItem(`viscum_request_draft_v4:${base}`);
      const raw = localStorage.getItem(draftKey(work.id, fromHandle));
      if (!raw) {
        setMessage("");
        return;
      }
      const d = JSON.parse(raw) as Draft;
      if (d.mentor) setMentor(d.mentor);
      if (typeof d.amountYen === "number") {
        const n = coerceDirectRequestAmountYen(d.amountYen, 5000);
        setAmountYen(n);
        if ((DIRECT_REQUEST_AMOUNT_PRESETS as readonly number[]).includes(n)) {
          setAmountMode("preset");
          setCustomAmount("");
        } else {
          setAmountMode("custom");
          setCustomAmount(String(n));
        }
      }
      if (typeof d.message === "string" && d.message.trim()) {
        if (
          isStaleTemplatePitch(d.message, work.title) ||
          d.message.trim() === work.description?.trim()
        ) {
          setMessage("");
          localStorage.removeItem(draftKey(work.id, fromHandle));
        } else {
          setMessage(d.message);
          setDraftNote(
            `下書きあり（${new Date(d.updatedAt).toLocaleString("ja-JP")}）`,
          );
        }
      } else {
        setMessage("");
      }
    } catch {
      setMessage("");
    }
  }, [work.id, work.title, work.description, fromHandle]);

  // 検索語で Neon プロフィールを拾う
  useEffect(() => {
    const needle = query.trim().toLowerCase().replace(/^@/, "");
    if (needle.length < 2) {
      setRemoteHint(null);
      return;
    }
    let cancelled = false;
    void fetchRemoteProfile(needle).then((remote) => {
      if (cancelled || !remote?.handle) {
        if (!cancelled) setRemoteHint(null);
        return;
      }
      const key = remote.handle.toLowerCase();
      if (fromHandle && key === fromHandle.toLowerCase()) {
        setRemoteHint(null);
        return;
      }
      setRemoteHint({
        handle: key,
        label: remote.accountName?.trim() || key,
        hint: remote.bio?.trim()?.slice(0, 80) || "（自己紹介未設定）",
        following: fromHandle ? isFollowing(fromHandle, key) : false,
        mutual:
          fromHandle && isFollowing(fromHandle, key)
            ? isFollowing(key, fromHandle)
            : false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [query, fromHandle]);

  const candidates = useMemo(() => {
    const base = collectCandidates(fromHandle, query);
    if (remoteHint && !base.some((c) => c.handle === remoteHint.handle)) {
      return [remoteHint, ...base].slice(0, 20);
    }
    if (remoteHint) {
      return base.map((c) =>
        c.handle === remoteHint.handle ? { ...c, ...remoteHint } : c,
      );
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromHandle, query, tick, remoteHint]);

  const selected =
    candidates.find((m) => m.handle === mentor) ||
    (mentor ? optionFromHandle(mentor, fromHandle) : null);

  const canSend = Boolean(
    delivery === "in_app" && fromHandle && selected?.handle && metaReady,
  );
  const canCopyOutbound = Boolean(fromHandle && metaReady);

  async function resolveWorkForAction(): Promise<Work | null> {
    if (ensureWork) {
      const next = await ensureWork();
      if (!next) return null;
      setActiveWork(next);
      return next;
    }
    return activeWork;
  }

  function buildWorkSummary(w: Work = activeWork) {
    const desc = w.description?.trim() ?? "";
    const focus = (w.prompts ?? []).map((s) => s.trim()).filter(Boolean);
    return (
      focus.length
        ? `${desc}\n\n【聞きたいこと】\n${focus.join("\n")}`
        : desc
    )
      .trim()
      .slice(0, 12_000);
  }

  /** 別端末でも開ける Neon 招待URLを用意（同時にやりとりスレも先出し） */
  async function ensureInvitePath(): Promise<{
    invitePath: string;
    requestPath?: string;
  } | null> {
    if (invitePath) {
      return { invitePath, requestPath: requestPath ?? undefined };
    }
    if (!fromHandle) {
      setCopyNote("先にログインしてください");
      return null;
    }
    if (!metaReady) {
      setCopyNote("タイトルと見てほしいURLを先に入れてください");
      return null;
    }
    const w = await resolveWorkForAction();
    if (!w) {
      setCopyNote("作品メモを保存できませんでした");
      return null;
    }
    setInviteBusy(true);
    setCopyNote(null);
    try {
      const res = await fetch("/api/dm-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId: w.id,
          workTitle: w.title.trim().slice(0, 200) || w.id,
          workExternalUrl: w.externalUrl?.trim() || undefined,
          workSummary: buildWorkSummary(w) || undefined,
          amountYen,
          pitch: message.trim() || undefined,
          closesInHours:
            typeof w.closesInHours === "number" && w.closesInHours > 0
              ? w.closesInHours
              : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        invite?: { id: string; path: string };
        request?: { id: string; path: string };
        error?: string;
      };
      if (!res.ok || !data.invite?.path) {
        setCopyNote(
          data.error || "招待URLを作れませんでした（ログインが必要）",
        );
        return null;
      }
      setInvitePath(data.invite.path);
      if (data.request?.path) setRequestPath(data.request.path);
      return {
        invitePath: data.invite.path,
        requestPath: data.request?.path,
      };
    } catch {
      setCopyNote("ネットワークエラー");
      return null;
    } finally {
      setInviteBusy(false);
    }
  }

  const fromLabel = fromHandle
    ? displayAccountName(fromHandle, readLocalProfile(fromHandle))
    : "（ログイン後に名前が入ります）";
  const amountLabel = formatRequestAmountLabel(amountYen);
  const workUrl = activeWork.externalUrl?.trim() || "";
  const pitchLine = message.trim() || "初見の感想を短くいただけると助かります。";
  const inviteUrlPreview =
    origin && invitePath
      ? `${origin}${invitePath}`
      : origin
        ? `${origin}/dm/i/（コピー時に発行）`
        : "/dm/i/（コピー時に発行）";
  const loginUrl = origin
    ? `${origin}/login?callbackUrl=${encodeURIComponent("/dashboard/messages")}`
    : "/login";

  function buildInternalShareText() {
    const to = selected?.label ? `${selected.label}さん\n` : "";
    return (
      `${to}` +
      `Viscumでレビューのお願いを送りました（またはこれから送ります）。\n` +
      `作品「${activeWork.title.trim() || "（タイトル）"}」／${amountLabel}\n` +
      (pitchLine ? `一言: ${pitchLine}\n` : "") +
      `\n` +
      `メッセージを開くにはログインが必要です。\n` +
      `${loginUrl}`
    ).trim();
  }

  function buildExternalShareText(inviteUrl: string) {
    return (
      `突然のご連絡失礼いたします。${fromLabel}と申します。\n` +
      `Viscum（レビュー依頼のサービス）を通じて、作品のフィードバックをお願いしたくご連絡しました。\n` +
      `\n` +
      `■ 作品\n` +
      `${activeWork.title.trim() || "（タイトル）"}\n` +
      (workUrl ? `${workUrl}\n` : "") +
      `\n` +
      `■ お願いしたいこと\n` +
      `${pitchLine}\n` +
      `\n` +
      `■ 謝礼\n` +
      `${amountLabel}\n` +
      `\n` +
      `下記リンクから依頼内容をご確認いただけます（リンクを知っている方向けです）。\n` +
      `ご返信・お受け取りにはViscumへのログイン（無料）が必要です。\n` +
      `ご都合が合わなければ、無視していただいて構いません。\n` +
      `\n` +
      `${inviteUrl}`
    ).trim();
  }

  const sharePreview =
    shareTone === "internal"
      ? buildInternalShareText()
      : buildExternalShareText(inviteUrlPreview);

  const saveDraft = useCallback(() => {
    const d: Draft = {
      mentor,
      message,
      amountYen,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftKey(work.id, fromHandle), JSON.stringify(d));
    setDraftNote(`一時保存しました（${new Date().toLocaleTimeString("ja-JP")}）`);
  }, [mentor, message, amountYen, work.id, fromHandle]);

  async function copyShareText() {
    setCopyNote(null);
    if (!fromHandle) {
      setCopyNote("先にログインしてください");
      return;
    }
    if (!metaReady) {
      setCopyNote("タイトルと見てほしいURLを先に入れてください");
      return;
    }
    let text = buildInternalShareText();
    let nextRequestPath = requestPath;
    if (shareTone === "external") {
      const ensured = await ensureInvitePath();
      if (!ensured) return;
      const url = `${window.location.origin}${ensured.invitePath}`;
      text = buildExternalShareText(url);
      nextRequestPath = ensured.requestPath ?? nextRequestPath;
    }
    try {
      await navigator.clipboard?.writeText(text);
      setCopyNote(
        shareTone === "external"
          ? "外部用の案内文をコピーしました。やりとりに返事待ちスレを発行済みです。"
          : "内部用の案内文をコピーしました",
      );
      if (delivery === "outbound" && shareTone === "external") {
        const dest = nextRequestPath ?? "/dashboard/messages";
        window.setTimeout(() => {
          router.push(dest);
        }, 500);
      }
    } catch {
      setCopyNote("コピーに失敗しました");
    }
  }

  return (
    <div className="space-y-5">
      {showWorkCard ? (
        <div>
          <p className="text-[13px] text-viscum-muted">作品</p>
          <p className="mt-0.5 text-[14px] font-medium text-viscum-ink line-clamp-2">
            {activeWork.title}
          </p>
          {isDemoSeed(activeWork.id) && (
            <p className="mt-2 rounded-md border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-2 text-[12px] leading-relaxed text-viscum-ink">
              いま開いているのは<strong>見本作品</strong>です。自分のシードに紐づけるには、シード完了画面の「サイト内のメンターに頼む」から開いてください（URLに{" "}
              <code className="text-[11px]">promo-</code>{" "}
              が入っていたら見本です）。
            </p>
          )}
        </div>
      ) : null}

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSend || !selected || !fromHandle || sending) return;
          setSendError(null);
          setSending(true);
          void (async () => {
            const w = await resolveWorkForAction();
            if (!w) {
              setSendError("作品メモを保存できませんでした（タイトルとURLを確認）");
              setSending(false);
              return;
            }
            const workTitle = w.title.trim().slice(0, 120) || w.id;
            const workSummary = buildWorkSummary(w);
            const pitch = message.trim() || "よろしくお願いします。";
            const remote = await postRequestDm({
              workId: w.id,
              workTitle,
              workExternalUrl: w.externalUrl?.trim() || undefined,
              workThumbUrl: w.thumbUrl?.trim() || undefined,
              workSummary: workSummary || undefined,
              toHandle: selected.handle,
              amountYen,
              pitch,
            });
            if (remote.ok && remote.request) {
              try {
                localStorage.removeItem(draftKey(work.id, fromHandle));
                localStorage.removeItem(draftKey(w.id, fromHandle));
              } catch {
                /* ignore */
              }
              router.push(
                `/dashboard/messages/${encodeURIComponent(remote.request.id)}`,
              );
              return;
            }
            const row = createRequestDm({
              workId: w.id,
              workTitle,
              workExternalUrl: w.externalUrl?.trim() || undefined,
              workThumbUrl: w.thumbUrl?.trim() || undefined,
              workSummary: workSummary || undefined,
              fromHandle,
              fromAccountName: displayAccountName(
                fromHandle,
                readLocalProfile(fromHandle),
              ),
              toHandle: selected.handle,
              amountYen,
              pitch,
            });
            setSendError(
              `${remote.error || "サーバー保存に失敗"}（この端末のみに保存しました）`,
            );
            setSending(false);
            router.push(`/dashboard/messages/${encodeURIComponent(row.id)}`);
          })();
        }}
      >
        <div>
          <p className="text-[13px] font-medium text-viscum-ink">
            謝礼 <span className="text-viscum-berry">必須</span>
          </p>
          <p className="mt-0.5 text-[12px] text-viscum-muted">
            完了時に相手へ支払う金額です（送った時点ではカード不要）。近い相手は無料も可。
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIRECT_REQUEST_AMOUNT_PRESETS.map((yen) => {
              const selectedAmt = amountMode === "preset" && amountYen === yen;
              return (
                <button
                  key={yen}
                  type="button"
                  onClick={() => {
                    setAmountMode("preset");
                    setAmountYen(yen);
                    setCustomAmount("");
                  }}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${
                    selectedAmt
                      ? "bg-viscum-brand text-white"
                      : "border border-viscum-line bg-white/70 text-viscum-ink"
                  }`}
                >
                  {yen <= 0 ? "無料" : formatRequestAmountLabel(yen)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setAmountMode("custom");
                if (!customAmount && amountYen > 0) {
                  setCustomAmount(String(amountYen));
                }
              }}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${
                amountMode === "custom"
                  ? "bg-viscum-brand text-white"
                  : "border border-viscum-line bg-white/70 text-viscum-ink"
              }`}
            >
              自由入力
            </button>
          </div>
          {amountMode === "custom" ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[13px] text-viscum-muted">¥</span>
              <input
                type="number"
                min={5000}
                step={1000}
                value={customAmount}
                onChange={(e) => {
                  const raw = e.target.value;
                  setCustomAmount(raw);
                  const n = Number(raw);
                  if (Number.isFinite(n)) {
                    setAmountYen(coerceDirectRequestAmountYen(n, 5000));
                  }
                }}
                placeholder="5000"
                className="w-36 rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-[14px] text-viscum-ink"
              />
              <span className="text-[11px] text-viscum-muted">下限 ¥5,000</span>
            </div>
          ) : null}
          <p className="mt-1.5 text-[12px] text-viscum-muted">
            いまの設定: {formatRequestAmountLabel(amountYen)}
          </p>
        </div>

        <div>
          <p className="text-[13px] font-medium text-viscum-ink">
            届け方 <span className="text-viscum-berry">必須</span>
          </p>
          <p className="mt-0.5 text-[12px] text-viscum-muted">
            登録済みの人には場内送信。未登録や外のやりとりは、リンク付き案内をコピペ（X・LINE・メールなど）。
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDelivery("in_app");
              }}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${
                delivery === "in_app"
                  ? "bg-viscum-brand text-white"
                  : "border border-viscum-line bg-white/70 text-viscum-ink"
              }`}
            >
              登録済みに送る
            </button>
            <button
              type="button"
              onClick={() => {
                setDelivery("outbound");
                setMentor("");
              }}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${
                delivery === "outbound"
                  ? "bg-viscum-brand text-white"
                  : "border border-viscum-line bg-white/70 text-viscum-ink"
              }`}
            >
              外に連絡（コピペ）
            </button>
          </div>
        </div>

        {delivery === "in_app" ? (
        <fieldset>
          <legend className="text-[13px] font-medium text-viscum-ink">
            誰に頼むか <span className="text-viscum-berry">必須</span>
          </legend>
          <p className="mt-1 text-[12px] text-viscum-muted">
            Viscumに登録済みの相手です。フォロー中から選ぶか、英語IDで検索。
          </p>
          {!fromHandle && (
            <p className="mt-2 text-[12px] text-viscum-muted">
              送るにはログインが必要です。{" "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(
                  showWorkCard
                    ? `/w/${activeWork.id}/request`
                    : "/new/request",
                )}`}
                className="text-viscum-brand underline"
              >
                ログイン
              </Link>
            </p>
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="英語IDや表示名で検索"
            className="mt-2 w-full rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-[14px] text-viscum-ink placeholder:text-viscum-muted"
            autoComplete="off"
          />
          <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
            {candidates.length === 0 && (
              <li className="rounded-md border border-dashed border-viscum-line px-3 py-2 text-[12px] text-viscum-muted">
                {query.trim()
                  ? "一致する人がいません。英語IDを確認して検索してください。"
                  : fromHandle
                    ? "フォロー中の人はまだいません。先にフォローするか、上で英語IDを検索してください。"
                    : "ログイン後、フォロー中の人がここに出ます。"}
              </li>
            )}
            {candidates.map((m) => (
              <li key={m.handle}>
                <label
                  className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 ${
                    mentor === m.handle
                      ? "border-viscum-brand bg-viscum-leaf-soft/40"
                      : "border-viscum-line bg-white/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="mentor"
                    className="mt-1"
                    checked={mentor === m.handle}
                    onChange={() => setMentor(m.handle)}
                    onClick={(e) => {
                      if (mentor === m.handle) {
                        e.preventDefault();
                        setMentor("");
                      }
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-viscum-ink">
                        {m.label}
                      </span>
                      <span className="text-[11px] text-viscum-muted">
                        @{m.handle}
                      </span>
                      {m.mutual && (
                        <span className="rounded bg-viscum-leaf-soft px-1.5 py-0.5 text-[10px] font-medium text-viscum-leaf-deep">
                          相互
                        </span>
                      )}
                      {m.following && !m.mutual && (
                        <span className="rounded bg-viscum-paper-2 px-1.5 py-0.5 text-[10px] text-viscum-muted">
                          フォロー中
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-viscum-muted">
                      {m.hint}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {mentor ? (
            <button
              type="button"
              onClick={() => setMentor("")}
              className="mt-2 text-[12px] text-viscum-muted underline"
            >
              選択を外す
            </button>
          ) : null}
        </fieldset>
        ) : (
          <div className="rounded-lg border border-dashed border-viscum-line bg-white/40 px-3 py-3 text-[12px] leading-relaxed text-viscum-muted">
            <p className="font-medium text-viscum-ink">外への届け方</p>
            <p className="mt-1">
              相手をViscum上で選ぶ必要はありません。下の案内文をコピーして、X・LINE・メールなどに貼ってください。
              <strong className="font-medium text-viscum-ink">コピー時に招待＋やりとりスレを発行</strong>
              します。ご依頼DMに「外リンク（返事待ち）」としてすぐ載ります。相手の返事で相手アカウントがスレに入ります。
            </p>
            <p className="mt-1">
              謝礼額はスレに固定されます（この時点ではカード不要。完了時払い）。メール欄からの直送はまだありません。
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="request-message"
            className="text-[13px] font-medium text-viscum-ink"
          >
            一言（任意）
          </label>
          <p className="mt-0.5 text-[12px] text-viscum-muted">
            作品の説明はシード側に載ります。ここは「なぜ頼むか」など短い一言だけで十分です。空でも進めます。案内文にも反映されます。
          </p>
          <textarea
            id="request-message"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1.5 w-full resize-y rounded-md border border-viscum-line bg-white/60 px-3 py-2 text-[14px] text-viscum-ink placeholder:text-viscum-muted"
            placeholder="例: UIの初見だけ見てほしいです"
          />
        </div>

        <div className="rounded-lg border border-viscum-line bg-viscum-paper-2/40 px-3 py-3">
          <p className="text-[13px] font-medium text-viscum-ink">
            連絡文テンプレ（コピペ）
            {delivery === "outbound" ? (
              <span className="ml-1 text-viscum-berry">本線</span>
            ) : null}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
            {delivery === "outbound"
              ? "届け方に合わせて外部用（丁寧）の文面です。コピーして相手のDMやメールに貼ってください。"
              : "届け方に合わせて内部用（短い）の文面です。場内送信のあと、念押し用に送れます（任意）。"}
          </p>
          <textarea
            readOnly
            rows={shareTone === "external" ? 14 : 8}
            value={sharePreview}
            className="mt-2 w-full resize-y rounded-md border border-viscum-line bg-white/80 px-3 py-2 font-sans text-[12px] leading-relaxed text-viscum-ink"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={inviteBusy || !canCopyOutbound}
              onClick={() => {
                void copyShareText();
              }}
              className="rounded-md bg-viscum-berry px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
            >
              {inviteBusy && shareTone === "external"
                ? "発行中…"
                : "案内文をコピー"}
            </button>
            {shareTone === "external" && (
              <button
                type="button"
                disabled={inviteBusy || !canCopyOutbound}
                onClick={() => {
                  void (async () => {
                    const ensured = await ensureInvitePath();
                    if (!ensured) return;
                    window.open(
                      ensured.invitePath,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  })();
                }}
                className="rounded-md border border-viscum-line px-3 py-1.5 text-[12px] font-medium text-viscum-brand disabled:opacity-50"
              >
                リンクをプレビュー
              </button>
            )}
          </div>
          {copyNote && (
            <p className="mt-2 text-[12px] text-viscum-brand">{copyNote}</p>
          )}
        </div>

        {sendError && (
          <p className="rounded-md border border-viscum-berry/40 bg-viscum-berry/10 px-3 py-2 text-[12px] text-viscum-berry-deep">
            {sendError}
          </p>
        )}
        {draftNote && (
          <p className="text-[12px] text-viscum-muted">{draftNote}</p>
        )}
        {!metaReady && (
          <p className="text-[12px] text-viscum-muted">
            上のタイトルと見てほしいURLを入れると、送信と案内文コピーが有効になります。
          </p>
        )}
        {delivery === "in_app" && metaReady && !selected?.handle && (
          <p className="text-[12px] text-viscum-muted">
            場内送信するには、上で相手を選んでください。
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-md border border-viscum-line bg-viscum-paper px-3 py-2.5 text-sm font-medium text-viscum-ink hover:bg-viscum-paper-2 sm:flex-1"
          >
            一時保存
          </button>
          {delivery === "in_app" ? (
            <button
              type="submit"
              disabled={!canSend || sending}
              className="rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:flex-[1.4]"
            >
              {sending ? "送信中…" : "直依頼を送る"}
            </button>
          ) : (
            <button
              type="button"
              disabled={inviteBusy || !canCopyOutbound}
              onClick={() => {
                void copyShareText();
              }}
              className="rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:flex-[1.4]"
            >
              {inviteBusy ? "発行中…" : "案内文をコピーして完了"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
