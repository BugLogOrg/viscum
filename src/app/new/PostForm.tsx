"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import {
  EditableReorderList,
  linesFromTexts,
  textsFromLines,
  type ReorderLine,
} from "@/components/EditableReorderList";
import { StatusBadge } from "@/components/StatusBadge";
import { THUMB_ASPECT } from "@/components/WorkFeedRow";
import { formatYen, type CompStatus } from "@/data/dummy-works";
import {
  FREE_COMMENT,
  MAX_BOOST_CRITERIA,
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
import { WORK_TITLE_MAX, WORK_DESCRIPTION_MAX, clampWorkTitle } from "@/lib/work-title";
import { resolveWorkThumbForSave } from "@/lib/resolve-work-thumb";

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
  /** 公開ブースト: 書いてほしい場所。初期は作品URLと同期 */
  const [boostWriteUrl, setBoostWriteUrl] = useState("https://");
  const [boostWriteSameAsWork, setBoostWriteSameAsWork] = useState(true);
  const [description, setDescription] = useState("");
  const [focusNote, setFocusNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [seedPlan, setSeedPlan] = useState<SeedPlanId>("free_comment");
  const [questions, setQuestions] = useState<ReorderLine[]>(() =>
    linesFromTexts([...courseById("first_impression").questions]),
  );
  const [boostCriteria, setBoostCriteria] = useState<ReorderLine[]>(() =>
    linesFromTexts([...PUBLIC_BOOST.criteria]),
  );
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
  const freeOn = seedPlan === "free_comment";
  const needsDeadline = compOn || freeOn;
  const courseId: SeedCourseId = isFieldCourse(seedPlan)
    ? seedPlan
    : "first_impression";
  const course = courseById(courseId);
  const prizeYen = course.yen;
  const extPrizeYen = PUBLIC_BOOST.yen;

  function selectPlan(next: SeedPlanId) {
    setSeedPlan(next);
    if (isFieldCourse(next)) {
      setQuestions(linesFromTexts([...courseById(next).questions]));
    }
  }

  const previewMeta = (() => {
    if (extReviewOn) {
      return `公開ブースト · 褒賞 ${formatYen(extPrizeYen)} · 記入後報告→選んで褒賞`;
    }
    if (compOn) {
      return `${course.name} · 褒賞 ${formatYen(prizeYen)} · 締切 あと約${closesInDays}日`;
    }
    return `無料コメント · コメント歓迎 · 締切 あと約${closesInDays}日`;
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

  const status: CompStatus =
    compOn || extReviewOn || freeOn ? "open" : "none";
  const badgePlanLabel = extReviewOn
    ? PUBLIC_BOOST.name
    : compOn
      ? course.name
      : "無料コメント";

  function isUsableHttpUrl(raw: string): boolean {
    const t = raw.trim();
    if (t.length < 12) return false;
    try {
      const u = new URL(t);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  /** コンペON時：編集済み質問リスト（空行は落とす） */
  const promptList = useMemo(() => {
    if (!compOn) return [] as string[];
    return textsFromLines(questions)
      .map((q) => q.trim())
      .filter(Boolean)
      .slice(0, MAX_COURSE_QUESTIONS);
  }, [compOn, questions]);

  const effectiveBoostWriteUrl = boostWriteSameAsWork
    ? externalUrl.trim()
    : boostWriteUrl.trim();

  const boostCriteriaList = useMemo(() => {
    if (!extReviewOn) return [] as string[];
    return textsFromLines(boostCriteria)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_BOOST_CRITERIA);
  }, [extReviewOn, boostCriteria]);

  const canSave =
    title.trim().length > 0 &&
    title.trim().length <= WORK_TITLE_MAX &&
    isUsableHttpUrl(externalUrl) &&
    description.trim().length > 0 &&
    description.trim().length <= WORK_DESCRIPTION_MAX &&
    (!compOn || (prizeYen >= 5000 && promptList.length >= 1)) &&
    (!extReviewOn ||
      (extPrizeYen === PUBLIC_BOOST.yen &&
        isUsableHttpUrl(effectiveBoostWriteUrl) &&
        boostCriteriaList.length >= 1));

  useEffect(() => {
    if (boostWriteSameAsWork) {
      setBoostWriteUrl(externalUrl);
    }
  }, [boostWriteSameAsWork, externalUrl]);

  function resetQuestionsToTemplate() {
    setQuestions(linesFromTexts([...course.questions]));
  }

  function resetBoostCriteria() {
    setBoostCriteria(linesFromTexts([...PUBLIC_BOOST.criteria]));
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
          let thumbStored: string | null = null;
          if (thumbUrl) {
            thumbStored = await resolveWorkThumbForSave(thumbUrl);
          }
          const payload = {
            title: clampWorkTitle(title),
            description: description.trim(),
            focusNote: focusNote.trim() || null,
            scaffoldLines: (() => {
              if (compOn) return promptList.length ? promptList : undefined;
              if (extReviewOn) {
                return boostCriteriaList.length ? boostCriteriaList : undefined;
              }
              return undefined;
            })(),
            externalUrl: externalUrl.trim(),
            boostWriteUrl: extReviewOn ? effectiveBoostWriteUrl : null,
            tags,
            plan: seedPlan,
            prizeYen: compOn
              ? prizeYen
              : extReviewOn
                ? extPrizeYen
                : null,
            closesInDays: needsDeadline
              ? closesInDays
              : extReviewOn
                ? 7
                : null,
            thumbUrl: thumbStored,
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
            boostWriteUrl: payload.boostWriteUrl ?? undefined,
            tags: payload.tags,
            status: compOn || extReviewOn || freeOn ? "open" : "none",
            prizeYen: compOn
              ? prizeYen
              : extReviewOn
                ? extPrizeYen
                : undefined,
            closesInDays: needsDeadline
              ? closesInDays
              : extReviewOn
                ? 7
                : undefined,
            extReviewOn: extReviewOn || undefined,
            extPrizeYen: extReviewOn ? extPrizeYen : undefined,
            seedPlan,
            planLabel: extReviewOn
              ? PUBLIC_BOOST.name
              : compOn
                ? course.name
                : "無料コメント",
            thumbDataUrl: thumbStored ?? undefined,
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
        <label className="block text-[15px] font-semibold text-viscum-ink">
          タイトル： <span className="text-[13px] font-medium text-viscum-berry">必須</span>
        </label>
        <p className="mt-0.5 text-[12px] text-viscum-muted">
          シード棚・Xカードに出る短いヘッドライン（最大{WORK_TITLE_MAX}字）。長く書きたい背景は下の説明へ。
        </p>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, WORK_TITLE_MAX))}
          rows={2}
          maxLength={WORK_TITLE_MAX}
          placeholder="例: VISCUMのコンセプト「個人作品×気軽な感想」は伝わりますか？"
          className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[15px] leading-snug text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none"
        />
        <p className="mt-1 text-right text-[11px] tabular-nums text-viscum-muted">
          {title.trim().length}/{WORK_TITLE_MAX}
        </p>
      </div>

      <div>
        <label className="block text-[15px] font-semibold text-viscum-ink">
          ご挨拶：{" "}
          <span className="text-[13px] font-normal text-viscum-muted">任意</span>
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
        <label className="block text-[15px] font-semibold text-viscum-ink">
          説明： <span className="text-[13px] font-medium text-viscum-berry">必須</span>
        </label>
        <p className="mt-0.5 text-[12px] text-viscum-muted">
          背景・文脈・「どこまで見れば十分か」。タイトルに入りきらない長文はここに（最大
          {WORK_DESCRIPTION_MAX}字）。
        </p>
        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value.slice(0, WORK_DESCRIPTION_MAX))
          }
          rows={5}
          maxLength={WORK_DESCRIPTION_MAX}
          className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] leading-relaxed text-viscum-ink focus:border-viscum-brand focus:outline-none"
        />
        <p className="mt-1 text-right text-[11px] tabular-nums text-viscum-muted">
          {description.trim().length}/{WORK_DESCRIPTION_MAX}
        </p>
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
            何が知りたい？（どれか一つ）
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-viscum-muted">
            欲しい反応から選びます。商品名は副。価格は ¥0／¥5,000／¥10,000／¥30,000
            だけ。褒賞は稀少（記入後に選んで払う）。同じ投稿では重ねません。
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                id: "free_comment" as const,
                want: FREE_COMMENT.want,
                title: FREE_COMMENT.name,
                yenLabel: "¥0",
                hint: null as string | null,
              },
              {
                id: "first_impression" as const,
                want: courseById("first_impression").want,
                title: courseById("first_impression").name,
                yenLabel: formatYen(courseById("first_impression").yen),
                hint: null as string | null,
              },
              {
                id: "brush_up" as const,
                want: courseById("brush_up").want,
                title: courseById("brush_up").name,
                yenLabel: formatYen(courseById("brush_up").yen),
                hint: null as string | null,
              },
              {
                id: "public_boost" as const,
                want: PUBLIC_BOOST.want,
                title: PUBLIC_BOOST.name,
                yenLabel: formatYen(PUBLIC_BOOST.yen),
                hint: PUBLIC_BOOST.seedHint,
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
                <span className="block text-[13px] font-medium leading-snug">
                  {opt.want}
                </span>
                <span
                  className={`mt-1.5 block text-[12px] ${on ? "text-white/90" : "text-viscum-muted"}`}
                >
                  {opt.title} · {opt.yenLabel}
                </span>
                {opt.hint ? (
                  <span
                    className={`mt-1.5 block text-[11px] font-medium leading-snug ${
                      on ? "text-white" : "text-viscum-berry-deep"
                    }`}
                  >
                    {opt.hint}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-viscum-muted">いまの見え方：</span>
          <StatusBadge
            status={status}
            prizeYen={compOn || extReviewOn ? (compOn ? prizeYen : extPrizeYen) : undefined}
            planLabel={badgePlanLabel}
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
                おすすめ質問です。編集・追加・削除・並べ替えできます。左のつまみをドラッグ。メンターはそのまま答えても、アレンジしても構いません（最大
                {MAX_COURSE_QUESTIONS}問）。
              </p>
              <EditableReorderList
                items={questions}
                onChange={setQuestions}
                max={MAX_COURSE_QUESTIONS}
                addLabel="＋質問を自由に追加"
                newItemText=""
                inputClassName="text-[14px]"
                emptyError="1問以上入れてください（空だとシードできません）。"
              />
            </div>
          </div>
        )}

        {needsDeadline && (
          <div
            className={`space-y-3 ${
              compOn
                ? "mt-4"
                : "border-t border-viscum-line pt-4"
            }`}
          >
            <div>
              <label className="text-[13px] font-medium text-viscum-ink">
                締切 <span className="text-viscum-berry">必須</span>
              </label>
              <p className="mt-0.5 text-[12px] text-viscum-muted">
                {freeOn
                  ? "無料でも募集期間を決めます。終わると終了間近→終了へ。シード棚に埋もれにくくなります。"
                  : "よく使う長さから選びます。細かい日時は後からでも変えられる想定です。"}
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
            {compOn ? (
              <p className="text-[11px] text-viscum-muted">
                払うのは選出・褒賞のあと（デモでは決済しません）。広げて候補を集め、刺さった人を選ぶのがシーダーの仕事です。
              </p>
            ) : null}
          </div>
        )}

        {extReviewOn && (
          <div className="space-y-4 border-t border-viscum-line pt-4">
            <div>
              <label className="block text-[13px] font-medium text-viscum-ink">
                書いてほしい場所（URL）{" "}
                <span className="text-viscum-berry">必須</span>
              </label>
              <p className="mt-0.5 text-[12px] text-viscum-muted">
                メンターが投稿・短評を残して報告する先（ストア／X／note など）。作品を触るURLと別にできます。
              </p>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px] text-viscum-ink">
                <input
                  type="checkbox"
                  checked={boostWriteSameAsWork}
                  onChange={(e) => setBoostWriteSameAsWork(e.target.checked)}
                  className="rounded border-viscum-line"
                />
                作品のURLと同じ
              </label>
              <input
                type="url"
                value={boostWriteSameAsWork ? externalUrl : boostWriteUrl}
                onChange={(e) => {
                  setBoostWriteSameAsWork(false);
                  setBoostWriteUrl(e.target.value);
                }}
                readOnly={boostWriteSameAsWork}
                placeholder="https://"
                className={`mt-1.5 w-full rounded-md border border-viscum-line px-3 py-2 text-[14px] text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none ${
                  boostWriteSameAsWork ? "bg-viscum-paper-2/80" : "bg-white/80"
                }`}
              />
              {!isUsableHttpUrl(effectiveBoostWriteUrl) ? (
                <p className="mt-1 text-[11px] text-viscum-berry-deep">
                  https:// から始まるURLを入れてください。
                </p>
              ) : null}
            </div>

            <p className="text-[13px] font-medium leading-relaxed text-viscum-berry-deep">
              肝はここです。メンターがストア／SNSなど
              <span className="underline decoration-viscum-berry/40 underline-offset-2">
                外に書いて報告
              </span>
              → あなたが誰に褒賞を上げるか選ぶ。依頼して書かせるのではなく募集します。星や好意は保証しません。
            </p>

            <ol className="list-decimal space-y-1 pl-5 text-[12px] leading-relaxed text-viscum-ink">
              <li>募集を出す（この画面）</li>
              <li>参加者が「書いてほしい場所」へ正直な反応・投稿を残す</li>
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
              <p className="mt-0.5 text-[12px] text-viscum-muted">
                ルールと見てほしい観点を並べます。左のつまみで順番を入れ替え、行の追加もできます（最大
                {MAX_BOOST_CRITERIA}行）。例：権限は怖くないか／何が片付くか。
              </p>
              <EditableReorderList
                items={boostCriteria}
                onChange={setBoostCriteria}
                max={MAX_BOOST_CRITERIA}
                addLabel="＋目安／観点を追加"
                newItemText="見てほしい観点："
                inputClassName="text-[13px]"
                emptyError="1行以上入れてください（空だとシードできません）。"
              />
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
        まだシード棚には出しません。次の画面で公開できます。
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
