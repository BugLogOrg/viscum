"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Work } from "@/data/dummy-works";
import { createRequestDm } from "@/lib/local-request-dms";
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
  closed: boolean;
  updatedAt: string;
};

function draftKey(workId: string, fromHandle: string) {
  return `viscum_request_draft_v3:${workId}:${fromHandle.toLowerCase() || "anon"}`;
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

export function DirectRequestForm({ work }: { work: Work }) {
  const router = useRouter();
  const { data: session } = useSession();
  const fromHandle = session?.user?.handle?.replace(/^@/, "").trim() ?? "";
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [mentor, setMentor] = useState("");
  const [message, setMessage] = useState("");
  const [closed, setClosed] = useState(false);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [remoteHint, setRemoteHint] = useState<MentorOption | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

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

  // 下書き復元（v3）。タイトル由来テンプレは捨てる
  useEffect(() => {
    try {
      const base = `${work.id}:${fromHandle.toLowerCase() || "anon"}`;
      localStorage.removeItem(`viscum_request_draft_v1:${base}`);
      localStorage.removeItem(`viscum_request_draft_v2:${base}`);
      const raw = localStorage.getItem(draftKey(work.id, fromHandle));
      if (!raw) {
        setMessage("");
        return;
      }
      const d = JSON.parse(raw) as Draft;
      if (d.mentor) setMentor(d.mentor);
      if (typeof d.closed === "boolean") setClosed(d.closed);
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

  const canSend = Boolean(fromHandle && selected?.handle);

  const saveDraft = useCallback(() => {
    const d: Draft = {
      mentor,
      message,
      closed,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftKey(work.id, fromHandle), JSON.stringify(d));
    setDraftNote(`一時保存しました（${new Date().toLocaleTimeString("ja-JP")}）`);
  }, [mentor, message, closed, work.id, fromHandle]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[13px] text-viscum-muted">作品</p>
        <p className="mt-0.5 text-[14px] font-medium text-viscum-ink line-clamp-2">
          {work.title}
        </p>
        {isDemoSeed(work.id) && (
          <p className="mt-2 rounded-md border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-2 text-[12px] leading-relaxed text-viscum-ink">
            いま開いているのは<strong>見本作品</strong>です。自分のシードに紐づけるには、シード完了画面の「サイト内のメンターに頼む」から開いてください（URLに{" "}
            <code className="text-[11px]">promo-</code>{" "}
            が入っていたら見本です）。
          </p>
        )}
      </div>

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSend || !selected || !fromHandle || sending) return;
          const workTitle = work.title.trim().slice(0, 120) || work.id;
          const desc = work.description?.trim() ?? "";
          const focus = (work.prompts ?? []).map((s) => s.trim()).filter(Boolean);
          const workSummary = (
            focus.length
              ? `${desc}\n\n【聞きたいこと】\n${focus.join("\n")}`
              : desc
          )
            .trim()
            .slice(0, 12_000);
          // 作品説明はスナップショット側。pitchは任意一言（空なら定型）
          const pitch =
            message.trim() || "よろしくお願いします。";
          setSendError(null);
          setSending(true);
          void (async () => {
            const remote = await postRequestDm({
              workId: work.id,
              workTitle,
              workExternalUrl: work.externalUrl?.trim() || undefined,
              workThumbUrl: work.thumbUrl?.trim() || undefined,
              workSummary: workSummary || undefined,
              toHandle: selected.handle,
              amountYen: 5000,
              pitch,
            });
            if (remote.ok && remote.request) {
              try {
                localStorage.removeItem(draftKey(work.id, fromHandle));
              } catch {
                /* ignore */
              }
              router.push(
                `/dashboard/messages/${encodeURIComponent(remote.request.id)}`,
              );
              return;
            }
            // Neon失敗時のみ端末フォールバック（相手端末には届かない）
            const row = createRequestDm({
              workId: work.id,
              workTitle,
              workExternalUrl: work.externalUrl?.trim() || undefined,
              workThumbUrl: work.thumbUrl?.trim() || undefined,
              workSummary: workSummary || undefined,
              fromHandle,
              fromAccountName: displayAccountName(
                fromHandle,
                readLocalProfile(fromHandle),
              ),
              toHandle: selected.handle,
              amountYen: 5000,
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
        <fieldset>
          <legend className="text-[13px] font-medium text-viscum-ink">
            誰に頼むか
          </legend>
          <p className="mt-1 text-[12px] text-viscum-muted">
            最初はフォロー中だけ出ます。他の人は英語IDや名前で検索。もう一度タップで選択解除できます。
          </p>
          {!fromHandle && (
            <p className="mt-2 text-[12px] text-viscum-muted">
              送るにはログインが必要です。{" "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/w/${work.id}/request`)}`}
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

        <div>
          <label
            htmlFor="request-message"
            className="text-[13px] font-medium text-viscum-ink"
          >
            一言（任意）
          </label>
          <p className="mt-0.5 text-[12px] text-viscum-muted">
            作品の説明はシード側に載ります。ここは「なぜあなたに頼むか」など短い一言だけで十分です。空でも送れます。
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

        <details className="rounded-lg border border-viscum-line bg-viscum-paper-2/40 px-3 py-2">
          <summary className="cursor-pointer text-[13px] font-medium text-viscum-ink">
            オプション（クローズド／外部URL）
          </summary>
          <div className="mt-3 space-y-3 border-t border-viscum-line/80 pt-3">
            <label className="flex items-start gap-2 text-[13px] text-viscum-ink">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={closed}
                onChange={(e) => setClosed(e.target.checked)}
              />
              <span>
                <span className="font-medium">クローズド（指名者のみ閲覧）</span>
                <span className="mt-0.5 block text-[12px] text-viscum-muted">
                  依頼は常に個人宛て。非公開設定は別物です。
                </span>
              </span>
            </label>
            <div className="space-y-2 text-[12px] text-viscum-muted">
              <p className="font-medium text-viscum-ink">
                未登録の人へ共有（アドレスをコピー）
              </p>
              <p className="text-[11px] leading-relaxed text-viscum-muted">
                URLを知っている人は誰でも開けます（鍵ではありません）。呼び方は任意で、入れると「○○さんへ」と出るだけです。
              </p>
              <label className="block text-[12px] text-viscum-ink">
                相手の呼び方
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    setCopyNote(null);
                  }}
                  placeholder="例: 太郎"
                  className="mt-1 w-full rounded-md border border-viscum-line bg-white/80 px-2.5 py-1.5 text-[13px] text-viscum-ink"
                />
              </label>
              <p className="break-all rounded border border-viscum-line bg-white/70 px-2 py-1.5 font-mono text-[11px] text-viscum-trunk">
                {origin
                  ? guestName.trim()
                    ? `${origin}/dm/${work.id}?to=${encodeURIComponent(guestName.trim())}`
                    : `${origin}/dm/${work.id}`
                  : guestName.trim()
                    ? `/dm/${work.id}?to=…`
                    : `/dm/${work.id}`}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const name = guestName.trim();
                    const url = name
                      ? `${window.location.origin}/dm/${work.id}?to=${encodeURIComponent(name)}`
                      : `${window.location.origin}/dm/${work.id}`;
                    void navigator.clipboard?.writeText(url).then(
                      () =>
                        setCopyNote(
                          name
                            ? "コピーしました（宛名入り）"
                            : "コピーしました（宛名なし。誰でも同じURLで開けます）",
                        ),
                      () => setCopyNote("コピーに失敗しました"),
                    );
                  }}
                  className="rounded-md bg-viscum-berry px-3 py-1.5 text-[12px] font-medium text-white"
                >
                  アドレスをコピー
                </button>
                <Link
                  href={
                    guestName.trim()
                      ? `/dm/${work.id}?to=${encodeURIComponent(guestName.trim())}`
                      : `/dm/${work.id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-viscum-line px-3 py-1.5 text-[12px] font-medium text-viscum-brand"
                >
                  プレビュー（別タブ）
                </Link>
              </div>
              {copyNote && (
                <p className="text-[12px] text-viscum-brand">{copyNote}</p>
              )}
            </div>
          </div>
        </details>

        {sendError && (
          <p className="rounded-md border border-viscum-berry/40 bg-viscum-berry/10 px-3 py-2 text-[12px] text-viscum-berry-deep">
            {sendError}
          </p>
        )}
        {draftNote && (
          <p className="text-[12px] text-viscum-muted">{draftNote}</p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-md border border-viscum-line bg-viscum-paper px-3 py-2.5 text-sm font-medium text-viscum-ink hover:bg-viscum-paper-2 sm:flex-1"
          >
            一時保存
          </button>
          <button
            type="submit"
            disabled={!canSend || sending}
            className="rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:flex-[1.4]"
          >
            {sending ? "送信中…" : "直依頼を送る"}
          </button>
        </div>
      </form>
    </div>
  );
}
