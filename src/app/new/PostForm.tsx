"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { THUMB_ASPECT } from "@/components/WorkFeedRow";
import { formatYen, type CompStatus } from "@/data/dummy-works";
import {
  MAX_COURSE_QUESTIONS,
  PUBLIC_BOOST,
  courseById,
  isFieldCourse,
  type SeedCourseId,
  type SeedPlanId,
} from "@/data/seed-courses";
import { addLocalSeed } from "@/lib/local-seeds";
import {
  displayAccountName,
  readLocalProfile,
} from "@/lib/local-profile";
import { WORK_TITLE_MAX, clampWorkTitle } from "@/lib/work-title";

const RECOMMENDED_TAGS = [
  "アプリ",
  "動画",
  "小説",
  "デザイン",
  "ツール",
  "Web",
  "ゲーム",
  "LP",
] as const;

/** 締切のプリセット（相対日数）。カレンダーよりミスりにくい */
const CLOSE_PRESETS = [
  { days: 3, label: "3日後" },
  { days: 7, label: "7日後" },
  { days: 14, label: "14日後" },
  { days: 30, label: "1か月後（30日）" },
] as const;

function formatClosesAtPreview(days: number, now = new Date()): string {
  const at = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
}

export function PostForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("https://");
  const [description, setDescription] = useState("");
  const [focusNote, setFocusNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [seedPlan, setSeedPlan] = useState<SeedPlanId>("free_comment");
  const [questions, setQuestions] = useState<string[]>(() => [
    ...courseById("first_impression").questions,
  ]);
  const [boostCriteria, setBoostCriteria] = useState<string[]>(() => [
    ...PUBLIC_BOOST.criteria,
  ]);
  const [closesInDays, setClosesInDays] = useState(7);
  const [saving, setSaving] = useState(false);
  /** 切り抜き後（プレビュー／保存に使う） */
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  /** 確定した元画像（再調整用） */
  const [thumbSourceUrl, setThumbSourceUrl] = useState<string | null>(null);
  /** いまダイアログに載せている画像（差し替え途中含む） */
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [thumbName, setThumbName] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const compOn = isFieldCourse(seedPlan);
  const extReviewOn = seedPlan === "public_boost";
  const courseId: SeedCourseId = isFieldCourse(seedPlan)
    ? seedPlan
    : "first_impression";
  const course = courseById(courseId);
  const prizeYen = course.yen;
  const extPrizeYen = PUBLIC_BOOST.yen;

  function selectPlan(next: SeedPlanId) {
    setSeedPlan(next);
    if (isFieldCourse(next)) {
      setQuestions([...courseById(next).questions]);
    }
  }

  const previewMeta = (() => {
    if (extReviewOn) {
      return `公開ブースト · 褒賞 ${formatYen(extPrizeYen)} · 記入後報告→選んで褒賞`;
    }
    if (compOn) {
      return `${course.name} · 褒賞 ${formatYen(prizeYen)} · 締切 あと約${closesInDays}日`;
    }
    return "無料コメント · コメント歓迎";
  })();

  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
      if (thumbSourceUrl) URL.revokeObjectURL(thumbSourceUrl);
      if (cropSrc && cropSrc !== thumbSourceUrl) URL.revokeObjectURL(cropSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  function clearThumb() {
    const source = thumbSourceUrl;
    const crop = cropSrc;
    const thumb = thumbUrl;
    setThumbUrl(null);
    setThumbSourceUrl(null);
    setCropSrc(null);
    setThumbName(null);
    setPendingName(null);
    setCropOpen(false);
    if (thumb) URL.revokeObjectURL(thumb);
    if (source) URL.revokeObjectURL(source);
    if (crop && crop !== source) URL.revokeObjectURL(crop);
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  }

  function onThumbPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("画像ファイルを選んでください");
      return;
    }
    // デモ上限（本番は圧縮・CDN想定）
    if (file.size > 5 * 1024 * 1024) {
      window.alert("デモでは5MBまでです");
      return;
    }
    const next = URL.createObjectURL(file);
    setCropSrc((prev) => {
      if (prev && prev !== thumbSourceUrl) URL.revokeObjectURL(prev);
      return next;
    });
    setPendingName(file.name);
    setCropOpen(true);
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  }

  function onCropApply(blob: Blob) {
    if (!cropSrc) return;
    const nextThumb = URL.createObjectURL(blob);
    setThumbUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextThumb;
    });
    if (cropSrc !== thumbSourceUrl) {
      setThumbSourceUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return cropSrc;
      });
    }
    if (pendingName) setThumbName(pendingName);
    setPendingName(null);
    setCropOpen(false);
  }

  function onCropCancel() {
    setCropOpen(false);
    if (cropSrc && cropSrc !== thumbSourceUrl) {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(thumbSourceUrl);
    }
    setPendingName(null);
  }

  function openRecrop() {
    if (!thumbSourceUrl) return;
    setCropSrc(thumbSourceUrl);
    setPendingName(null);
    setCropOpen(true);
  }

  const status: CompStatus = compOn ? "open" : "none";

  /** コンペON時：編集済み質問リスト（空行は落とす） */
  const promptList = useMemo(() => {
    if (!compOn) return [] as string[];
    return questions.map((q) => q.trim()).filter(Boolean).slice(0, MAX_COURSE_QUESTIONS);
  }, [compOn, questions]);

  const canSave =
    title.trim().length > 0 &&
    title.trim().length <= WORK_TITLE_MAX &&
    externalUrl.trim().length > 8 &&
    description.trim().length > 0 &&
    (!compOn || (prizeYen >= 5000 && promptList.length >= 1)) &&
    (!extReviewOn || extPrizeYen === PUBLIC_BOOST.yen);

  function setQuestionAt(index: number, value: string) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  function addQuestion() {
    setQuestions((prev) =>
      prev.length >= MAX_COURSE_QUESTIONS ? prev : [...prev, ""],
    );
  }

  function removeQuestion(index: number) {
    setQuestions((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

  function resetQuestionsToTemplate() {
    setQuestions([...course.questions]);
  }

  function setCriterionAt(index: number, value: string) {
    setBoostCriteria((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  function resetBoostCriteria() {
    setBoostCriteria([...PUBLIC_BOOST.criteria]);
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function addCustomTag() {
    const t = customTag.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setCustomTag("");
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave || saving) return;
        void (async () => {
          setSaving(true);
          try {
          let thumbDataUrl: string | undefined;
          if (thumbUrl) {
            try {
              const res = await fetch(thumbUrl);
              const blob = await res.blob();
              // localStorage 上限対策：大きすぎるサムネは捨てる
              if (blob.size <= 450_000) {
                thumbDataUrl = await new Promise<string>((resolve, reject) => {
                  const r = new FileReader();
                  r.onload = () => resolve(String(r.result));
                  r.onerror = () => reject(new Error("read"));
                  r.readAsDataURL(blob);
                });
              }
            } catch {
              /* ignore */
            }
          }
          const payload = {
            title: clampWorkTitle(title),
            description: description.trim(),
            focusNote: focusNote.trim() || null,
            scaffoldLines: (() => {
              if (compOn) return promptList.length ? promptList : undefined;
              if (extReviewOn) {
                const lines = boostCriteria
                  .map((s) => s.trim())
                  .filter(Boolean);
                return lines.length ? lines : undefined;
              }
              return undefined;
            })(),
            externalUrl: externalUrl.trim(),
            tags,
            plan: seedPlan,
            prizeYen: compOn
              ? prizeYen
              : extReviewOn
                ? extPrizeYen
                : null,
            closesInDays: compOn ? closesInDays : null,
            thumbUrl: thumbDataUrl ?? null,
            listedOnShelf: false,
          };

          const userId = session?.user?.id?.trim();
          if (userId && session?.user?.handle?.trim()) {
            const res = await fetch("/api/works", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) {
              const err = (await res.json().catch(() => null)) as {
                error?: string;
              } | null;
              window.alert(
                err?.error === "login required"
                  ? "ログインが必要です"
                  : err?.error === "database unavailable"
                    ? "データベースに接続できません。しばらくしてから再度お試しください。"
                    : "保存に失敗しました",
              );
              return;
            }
            const data = (await res.json()) as { work?: { id: string } };
            const id = data.work?.id;
            if (!id) {
              window.alert("保存に失敗しました");
              return;
            }
            router.push(`/w/${encodeURIComponent(id)}?seeded=1`);
            return;
          }

          const seederHandle =
            session?.user?.handle?.replace(/^@/, "").trim() || "guest";
          const fromSession =
            session?.user?.name?.trim() &&
            session.user.name.trim().toLowerCase() !== seederHandle.toLowerCase()
              ? session.user.name.trim()
              : undefined;
          const seederAccountName =
            fromSession ||
            displayAccountName(seederHandle, readLocalProfile(seederHandle));
          const row = addLocalSeed({
            lane: "shelf",
            seederHandle,
            seederAccountName:
              seederAccountName.toLowerCase() !== seederHandle.toLowerCase()
                ? seederAccountName
                : undefined,
            title: payload.title,
            description: payload.description,
            focusNote: payload.focusNote ?? undefined,
            scaffoldLines: payload.scaffoldLines,
            externalUrl: payload.externalUrl,
            tags: payload.tags,
            status: compOn ? "open" : "none",
            prizeYen: compOn ? prizeYen : undefined,
            closesInDays: compOn ? closesInDays : undefined,
            extReviewOn: extReviewOn || undefined,
            extPrizeYen: extReviewOn ? extPrizeYen : undefined,
            seedPlan,
            planLabel: extReviewOn
              ? PUBLIC_BOOST.name
              : compOn
                ? course.name
                : "無料コメント",
            thumbDataUrl,
          });
          // 棚レーン: 保存後は公開ステップ（直依頼二択なし）
          router.push(`/w/${row.id}?seeded=1`);
          } finally {
            setSaving(false);
          }
        })();
      }}
    >
      <div>
        <label className="block text-[13px] font-medium text-viscum-ink">
          タイトル <span className="text-viscum-berry">必須</span>
        </label>
        <p className="mt-0.5 text-[12px] text-viscum-muted">
          棚・Xカードに出る短いヘッドライン（最大{WORK_TITLE_MAX}字）。長く書きたい背景は下の説明へ。
        </p>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, WORK_TITLE_MAX))}
          rows={2}
          maxLength={WORK_TITLE_MAX}
          placeholder="例: 少額コンペ＝少額広告の顔は伝わるか"
          className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[15px] leading-snug text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none"
        />
        <p className="mt-1 text-right text-[11px] tabular-nums text-viscum-muted">
          {title.trim().length}/{WORK_TITLE_MAX}
        </p>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-viscum-ink">
          ご挨拶{" "}
          <span className="font-normal text-viscum-muted">任意</span>
        </label>
        <p className="mt-0.5 text-[12px] leading-relaxed text-viscum-muted">
          メンターへの声かけです。見てほしい入口・温度・背景を一言。コースを選んでも消えません。初見／改善では下の「聞くこと」も別で足せます。
        </p>
        <textarea
          value={focusNote}
          onChange={(e) => setFocusNote(e.target.value)}
          rows={3}
          placeholder="例: 冒頭1秒で何の製品か分かるか、厳しめで短くて大丈夫です"
          className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] leading-relaxed text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none"
        />
      </div>

      <div>
        <p className="text-[13px] font-medium text-viscum-ink">
          サムネイル{" "}
          <span className="font-normal text-viscum-muted">任意・推奨</span>
        </p>
        <p className="mt-0.5 text-[12px] text-viscum-muted">
          選んだあと、ズームと位置で枠に合わせられます（Xのプロフィール画像に近い操作）。未設定なら色面です。
        </p>
        <input
          ref={thumbInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onThumbPick(e.target.files?.[0])}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => thumbInputRef.current?.click()}
            className="rounded-md border border-viscum-line bg-white/80 px-3 py-1.5 text-[13px] font-medium text-viscum-brand hover:border-viscum-brand hover:bg-viscum-leaf-soft/40"
          >
            {thumbUrl ? "差し替え" : "画像を選ぶ"}
          </button>
          {thumbSourceUrl && (
            <button
              type="button"
              onClick={openRecrop}
              className="rounded-md border border-viscum-line bg-white/80 px-3 py-1.5 text-[13px] font-medium text-viscum-ink hover:bg-viscum-paper-2"
            >
              ズーム・切り抜き
            </button>
          )}
          {thumbUrl ? (
            <>
              <span className="max-w-[12rem] truncate text-[12px] text-viscum-muted">
                {thumbName}
              </span>
              <button
                type="button"
                onClick={clearThumb}
                className="text-[13px] text-viscum-muted underline"
              >
                外す
              </button>
            </>
          ) : (
            <span className="text-[11px] text-viscum-muted">
              JPG / PNG / WebP · デモは5MBまで
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-viscum-ink">
          作品のURL <span className="text-viscum-berry">必須</span>
        </label>
        <input
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="https://"
          className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium text-viscum-ink">
          説明 <span className="text-viscum-berry">必須</span>
        </label>
        <p className="mt-0.5 text-[12px] text-viscum-muted">
          背景・文脈・「どこまで見れば十分か」。タイトルに入りきらない長文はここに。
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] leading-relaxed text-viscum-ink focus:border-viscum-brand focus:outline-none"
        />
      </div>

      <div>
        <p className="text-[13px] font-medium text-viscum-ink">タグ</p>
        <p className="mt-0.5 text-[12px] text-viscum-muted">
          推奨から選ぶか、自由に追加。空でも出せますが、見つかる確率は下がります。
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RECOMMENDED_TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-md border px-2.5 py-1 text-[12px] transition ${
                  on
                    ? "border-viscum-brand bg-viscum-leaf-soft font-medium text-viscum-brand"
                    : "border-viscum-line bg-white/60 text-viscum-ink hover:border-viscum-brand"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            placeholder="自由タグ"
            className="min-w-0 flex-1 rounded-md border border-viscum-line bg-white/80 px-3 py-1.5 text-[13px] focus:border-viscum-brand focus:outline-none"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="shrink-0 rounded-md border border-viscum-line px-3 py-1.5 text-[13px] text-viscum-brand hover:bg-viscum-leaf-soft"
          >
            追加
          </button>
        </div>
        {tags.length > 0 && (
          <p className="mt-2 text-[12px] text-viscum-muted">
            選択中：{tags.join(" / ")}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-viscum-line bg-viscum-paper-2/40 px-4 py-4 space-y-4">
        <div>
          <p className="text-[14px] font-medium text-viscum-ink">
            コース（どれか一つ）
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-viscum-muted">
            価格は ¥0／¥5,000／¥10,000／¥30,000
            だけ。褒賞は稀少（記入後に選んで払う）。同じ投稿ではコースを重ねません。
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                id: "free_comment" as const,
                title: "無料コメント",
                yenLabel: "¥0",
                body: "コメント歓迎。お金は使いません。",
              },
              {
                id: "first_impression" as const,
                title: "初見レビュー",
                yenLabel: formatYen(5000),
                body: "初めて見た人に「どう見えたか」を聞く",
              },
              {
                id: "brush_up" as const,
                title: "改善提案",
                yenLabel: formatYen(10000),
                body: "どこを直せば伝わるかを聞く",
              },
              {
                id: "public_boost" as const,
                title: "公開ブースト",
                yenLabel: formatYen(PUBLIC_BOOST.yen),
                body: "外に書いて報告→あなたが選んで褒賞",
              },
            ] as const
          ).map((opt) => {
            const on = seedPlan === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => selectPlan(opt.id)}
                className={`rounded-md border px-3 py-2.5 text-left transition ${
                  on
                    ? "border-viscum-berry bg-viscum-berry text-white"
                    : "border-viscum-line bg-white/70 text-viscum-ink hover:border-viscum-berry"
                }`}
              >
                <span className="block text-[13px] font-medium">{opt.title}</span>
                <span
                  className={`mt-0.5 block text-[12px] ${on ? "text-white/90" : "text-viscum-muted"}`}
                >
                  {opt.yenLabel}
                </span>
                <span
                  className={`mt-1 block text-[11px] leading-snug ${on ? "text-white/85" : "text-viscum-muted"}`}
                >
                  {opt.body}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-viscum-muted">いまの見え方：</span>
          <StatusBadge
            status={status}
            prizeYen={compOn ? prizeYen : undefined}
          />
          <span className="text-[12px] text-viscum-ink">{previewMeta}</span>
        </div>

        {compOn && (
          <div className="space-y-4 border-t border-viscum-line pt-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-viscum-ink">
                  聞くこと
                </p>
                <button
                  type="button"
                  onClick={resetQuestionsToTemplate}
                  className="text-[12px] text-viscum-brand underline"
                >
                  おすすめに戻す
                </button>
              </div>
              <p className="mt-0.5 text-[12px] text-viscum-muted">
                おすすめ質問です。編集・追加・削除できます。メンターはそのまま答えても、アレンジしても構いません（最大
                {MAX_COURSE_QUESTIONS}問）。
              </p>
              <ul className="mt-2 space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 w-5 shrink-0 text-[12px] text-viscum-muted">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => setQuestionAt(i, e.target.value)}
                      className="min-w-0 flex-1 rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] text-viscum-ink focus:border-viscum-brand focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      disabled={questions.length <= 1}
                      className="shrink-0 rounded-md border border-viscum-line px-2 py-1 text-[12px] text-viscum-muted hover:border-viscum-berry hover:text-viscum-berry disabled:opacity-40"
                      aria-label={`質問${i + 1}を削除`}
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
              {questions.length < MAX_COURSE_QUESTIONS && (
                <button
                  type="button"
                  onClick={addQuestion}
                  className="mt-2 text-[13px] font-medium text-viscum-brand underline"
                >
                  ＋質問を自由に追加
                </button>
              )}
              {promptList.length === 0 && (
                <p className="mt-2 text-[12px] text-viscum-berry-deep">
                  1問以上入れてください（空だとシードできません）。
                </p>
              )}
            </div>

            <div>
              <label className="text-[13px] font-medium text-viscum-ink">
                締切
              </label>
              <p className="mt-0.5 text-[12px] text-viscum-muted">
                よく使う長さから選びます。細かい日時は後からでも変えられる想定です。
              </p>
              <select
                value={closesInDays}
                onChange={(e) => setClosesInDays(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] focus:border-viscum-brand focus:outline-none"
              >
                {CLOSE_PRESETS.map((p) => (
                  <option key={p.days} value={p.days}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[12px] text-viscum-ink">
                いま選ぶと →{" "}
                <time
                  dateTime={new Date(
                    Date.now() + closesInDays * 86400000,
                  ).toISOString()}
                >
                  {formatClosesAtPreview(closesInDays)}
                </time>{" "}
                ごろ
              </p>
            </div>
            <p className="text-[11px] text-viscum-muted">
              払うのは採用したあと（デモでは決済しません）。広げて候補を集め、刺さった人を選ぶのがシーダーの仕事です。
            </p>
          </div>
        )}

        {extReviewOn && (
          <div className="space-y-4 border-t border-viscum-line pt-4">
            <p className="text-[12px] leading-relaxed text-viscum-muted">
              依頼して書かせるのではなく、募集します。メンターが外に書いて報告→あなたが誰に上げるか選ぶ。星や好意は保証しません。
            </p>

            <ol className="list-decimal space-y-1 pl-5 text-[12px] leading-relaxed text-viscum-ink">
              <li>募集を出す（この画面）</li>
              <li>参加者が外に正直な反応・投稿を残す</li>
              <li>記入後に投稿URLなどを報告</li>
              <li>あなたが報告を見て、褒賞を上げる相手を選ぶ</li>
            </ol>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-viscum-ink">
                  募集の目安
                </p>
                <button
                  type="button"
                  onClick={resetBoostCriteria}
                  className="text-[12px] text-viscum-brand underline"
                >
                  おすすめに戻す
                </button>
              </div>
              <ul className="mt-2 space-y-2">
                {boostCriteria.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 w-5 shrink-0 text-[12px] text-viscum-muted">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => setCriterionAt(i, e.target.value)}
                      className="min-w-0 flex-1 rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[13px] text-viscum-ink focus:border-viscum-brand focus:outline-none"
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[11px] text-viscum-muted">
                全員払いではありません。虚偽・未使用・禁止違反は除外の目安。お支払いは褒賞額＋約10%（決済込み・シーダー負担）。人数保証・星の売買はしません。
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md border border-viscum-berry/25 bg-white/60 px-3 py-3">
        <p className="text-[11px] font-medium tracking-wide text-viscum-berry-deep">
          見え方（プレビュー）
        </p>
        {thumbUrl ? (
          <div
            className={`mt-2 w-full overflow-hidden rounded ${THUMB_ASPECT}`}
            style={{ aspectRatio: "1280 / 670" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`mt-2 flex w-full items-center justify-center rounded bg-viscum-leaf-deep/80 text-[11px] text-white/80 ${THUMB_ASPECT}`}
            style={{ aspectRatio: "1280 / 670" }}
          >
            サムネ未設定（色面仮置き）
          </div>
        )}
        <p className="mt-2 text-[14px] font-semibold leading-snug text-viscum-ink line-clamp-3">
          {title.trim() || "（短いタイトルがヘッドラインになります）"}
        </p>
        <p className="mt-1 text-[12px] text-viscum-ink">{previewMeta}</p>
      </div>

      <button
        type="submit"
        disabled={!canSave || saving}
        className="w-full rounded-md bg-viscum-berry px-4 py-3 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-45"
      >
        {saving ? "保存中…" : "一旦保存する"}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-viscum-muted">
        まだ棚には出しません。次の画面で公開できます。
        <br />
        あとから確認するときは{" "}
        <Link href="/dashboard" className="text-viscum-brand underline">
          「ダッシュボード」
        </Link>
        を見てください。
      </p>

      {cropSrc && (
        <ImageCropDialog
          src={cropSrc}
          open={cropOpen}
          onCancel={onCropCancel}
          onApply={onCropApply}
        />
      )}
    </form>
  );
}
