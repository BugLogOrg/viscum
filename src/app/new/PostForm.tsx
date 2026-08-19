"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { StatusBadge } from "@/components/StatusBadge";
import { THUMB_ASPECT } from "@/components/WorkFeedRow";
import { formatYen, type CompStatus } from "@/data/dummy-works";
import {
  SEED_COURSES,
  MAX_COURSE_QUESTIONS,
  courseById,
  type SeedCourseId,
} from "@/data/seed-courses";
import { addLocalSeed } from "@/lib/local-seeds";

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

/** 公開ブースト（プランD）本命帯。旗艦は¥30,000パッケージ */
const EXT_REVIEW_PRESETS = [5000, 10000, 30000] as const;

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

/** デモ保存後の「詳細」見本（実DBなし） */
const DEMO_WORK_ID = "promo-15s";
const DEMO_DETAIL_HREF = `/w/${DEMO_WORK_ID}`;
const DEMO_REQUEST_HREF = `/w/${DEMO_WORK_ID}/request`;
const DEMO_DM_HREF = `/dm/${DEMO_WORK_ID}?to=${encodeURIComponent("太郎")}`;

export function PostForm() {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("https://");
  const [description, setDescription] = useState("");
  const [focusNote, setFocusNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [compOn, setCompOn] = useState(false);
  const [extReviewOn, setExtReviewOn] = useState(false);
  const [courseId, setCourseId] = useState<SeedCourseId>("first_impression");
  const [questions, setQuestions] = useState<string[]>(() => [
    ...courseById("first_impression").questions,
  ]);
  const [extPrizeYen, setExtPrizeYen] =
    useState<(typeof EXT_REVIEW_PRESETS)[number]>(5000);
  const [closesInDays, setClosesInDays] = useState(7);
  const [saved, setSaved] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [thumbName, setThumbName] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const course = courseById(courseId);
  const prizeYen = course.yen;

  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [thumbUrl]);

  function clearThumb() {
    setThumbUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setThumbName(null);
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
    setThumbUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setThumbName(file.name);
  }

  const status: CompStatus = compOn ? "open" : "none";

  /** コンペON時：編集済み質問リスト（空行は落とす） */
  const promptList = useMemo(() => {
    if (!compOn) return [] as string[];
    return questions.map((q) => q.trim()).filter(Boolean).slice(0, MAX_COURSE_QUESTIONS);
  }, [compOn, questions]);

  const canSave =
    title.trim().length > 0 &&
    externalUrl.trim().length > 8 &&
    description.trim().length > 0 &&
    (!compOn || (prizeYen >= 5000 && promptList.length >= 1)) &&
    (!extReviewOn || extPrizeYen >= 5000);

  function applyCourse(id: SeedCourseId) {
    const next = courseById(id);
    setCourseId(id);
    setQuestions([...next.questions]);
    if (id === "boost") {
      setExtPrizeYen(30000);
    }
  }

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

  function shareText() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${DEMO_DETAIL_HREF}`
        : DEMO_DETAIL_HREF;
    const lines: string[] = [];
    if (compOn && extReviewOn) {
      lines.push(
        `【VISCUM】コメントコンペ＋公開ブースト · 場内 ${formatYen(prizeYen)}／公開 ${formatYen(extPrizeYen)}`,
      );
    } else if (compOn) {
      lines.push(
        `【VISCUM】${course.name} · チップ ${formatYen(prizeYen)}`,
      );
    } else if (extReviewOn) {
      lines.push(
        `【VISCUM】公開ブースト募集 · 合格で ${formatYen(extPrizeYen)}（検品後払い）`,
      );
    } else {
      lines.push(`【VISCUM】コメント歓迎`);
    }
    lines.push(title.trim() || "（タイトル）", url);
    if (compOn) {
      if (promptList.length > 0) {
        lines.push("", ...promptList.map((p) => `・${p}`));
      } else {
        lines.push("", "見て書いてくれる人、募集しています。");
      }
    }
    if (extReviewOn) {
      lines.push(
        "",
        "ストア／拡張／SNSなど公開の場所への正直な反応・投稿も募集（やらせ不可・合格者へ確実払い）。",
      );
    }
    return lines.join("\n");
  }

  if (saved) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-viscum-leaf/40 bg-viscum-leaf-soft/40 px-4 py-4">
          <p className="text-[13px] font-medium text-viscum-leaf-deep">
            デモ：シードした体で保存しました（まだDBには載りません）
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-viscum-ink">
            {session?.user
              ? "この端末の成績に保存しました。ダッシュボード（/dashboard）で閲覧・スキ・気になるの集計を確認できます（Neon接続前は端末内）。"
              : "ログインしていないため成績には残していません。ログインしてからシードするとダッシュボードに並びます。"}
          </p>
        </div>

        <div className="space-y-2">
          {thumbUrl && (
            <div
              className={`w-full overflow-hidden rounded-lg border border-viscum-line ${THUMB_ASPECT}`}
              style={{ aspectRatio: "1280 / 670" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl}
                alt="サムネプレビュー"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <StatusBadge status={status} prizeYen={compOn ? prizeYen : undefined} />
          <h2 className="text-xl font-semibold leading-snug text-viscum-ink">
            {title.trim()}
          </h2>
          {tags.length > 0 && (
            <p className="text-[12px] text-viscum-muted">
              タグ：{tags.join(" / ")}
            </p>
          )}
          {(compOn ? promptList.length > 0 : Boolean(focusNote.trim())) && (
            <div className="text-[14px] leading-relaxed text-viscum-ink">
              {compOn && promptList.length > 0 ? (
                <>
                  <p className="mb-1 text-[12px] font-medium text-viscum-muted">
                    {course.name}
                  </p>
                  <ul className="list-inside list-disc space-y-0.5">
                    {promptList.map((p) => (
                      <li key={p}>お題: {p}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>{focusNote.trim()}</p>
              )}
            </div>
          )}
          {compOn && (
            <p className="text-[13px] text-viscum-ink">
              {course.name} · チップ {formatYen(prizeYen)} · 締切 あと約
              {closesInDays}日
            </p>
          )}
        </div>

        <div className="rounded-lg border border-viscum-berry/30 bg-viscum-berry/5 px-4 py-4 space-y-3">
          <p className="text-[14px] font-medium text-viscum-berry-deep">
            共有する
          </p>
          <p className="text-[12px] leading-relaxed text-viscum-muted">
            SNSは拡声器。コンペやお願いのURLを、自分で貼って営業します。
          </p>
          <pre className="whitespace-pre-wrap break-all rounded-md border border-viscum-line bg-white/70 px-3 py-2 text-[12px] text-viscum-trunk">
            {shareText()}
          </pre>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-viscum-berry px-4 py-2 text-sm font-medium text-white hover:bg-viscum-berry-deep"
              onClick={() => {
                void navigator.clipboard?.writeText(shareText());
                window.alert("【デモ】コピーしました");
              }}
            >
              文面をコピー
            </button>
            <Link
              href={DEMO_DETAIL_HREF}
              className="inline-flex items-center rounded-md border border-viscum-brand px-4 py-2 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
            >
              見本の詳細を見る
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-viscum-line bg-white/50 px-4 py-4 space-y-3">
          <p className="text-[14px] font-medium text-viscum-ink">直依頼する</p>
          <p className="text-[12px] leading-relaxed text-viscum-muted">
            公開コンペとは別で、「あなたに書いてほしい」と特定の人だけに声をかけます。VISCUMにいるメンター向けと、まだ知らない人向け（DM用URL）があります。
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={DEMO_REQUEST_HREF}
              className="inline-flex w-full items-center justify-center rounded-md border border-viscum-brand bg-viscum-paper px-3 py-2 text-sm font-medium text-viscum-brand hover:bg-viscum-leaf-soft"
            >
              サイト内のメンターに頼む
            </Link>
            <Link
              href={DEMO_DM_HREF}
              className="inline-flex w-full items-center justify-center rounded-md bg-viscum-berry px-3 py-2 text-sm font-medium text-white hover:bg-viscum-berry-deep"
            >
              外部DM用ページ（例）
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="text-sm text-viscum-brand underline"
          onClick={() => setSaved(false)}
        >
          フォームに戻る
        </button>
        {session?.user && (
          <p className="text-center text-sm">
            <Link href="/dashboard" className="text-viscum-brand underline">
              ダッシュボードで成績を見る
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        if (session?.user?.handle) {
          addLocalSeed({
            seederHandle: session.user.handle,
            title: title.trim(),
            description: description.trim(),
            focusNote:
              (compOn ? promptList.join("\n") : focusNote.trim()) || undefined,
            externalUrl: externalUrl.trim(),
            tags,
            status: compOn ? "open" : "none",
            prizeYen: compOn ? prizeYen : undefined,
            closesInDays: compOn ? closesInDays : undefined,
            extReviewOn: extReviewOn || undefined,
            extPrizeYen: extReviewOn ? extPrizeYen : undefined,
          });
        }
        setSaved(true);
      }}
    >
      <div>
        <label className="block text-[13px] font-medium text-viscum-ink">
          タイトル <span className="text-viscum-berry">必須</span>
        </label>
        <p className="mt-0.5 text-[12px] text-viscum-muted">
          シード（棚）の見出し＝小さな広告のヘッドライン。何を出して、何をしてほしいかをここに。
        </p>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={3}
          placeholder="何を出して、どこを見てほしいか。シードではここが主役です"
          className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[15px] leading-snug text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none"
        />
      </div>

      <div>
        <p className="text-[13px] font-medium text-viscum-ink">
          サムネイル <span className="font-normal text-viscum-muted">任意・推奨</span>
        </p>
        <p className="mt-0.5 text-[12px] text-viscum-muted">
          棚と詳細の顔になります。比率は横長（約16:9寄り／1280×670想定）。なくても色面で仮置きできます。
        </p>
        <input
          ref={thumbInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onThumbPick(e.target.files?.[0])}
        />
        {thumbUrl ? (
          <div className="mt-2 space-y-2">
            <div
              className={`w-full overflow-hidden rounded-lg border border-viscum-line ${THUMB_ASPECT}`}
              style={{ aspectRatio: "1280 / 670" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="truncate text-[12px] text-viscum-muted">
                {thumbName}
              </p>
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="text-[13px] font-medium text-viscum-brand underline"
              >
                差し替え
              </button>
              <button
                type="button"
                onClick={clearThumb}
                className="text-[13px] text-viscum-muted underline"
              >
                外す
              </button>
            </div>
            <p className="text-[11px] text-viscum-muted">
              デモではこの端末内のプレビューのみ。サーバーには保存しません。
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => thumbInputRef.current?.click()}
            className={`mt-2 flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-viscum-line bg-white/50 px-3 py-6 text-viscum-muted transition hover:border-viscum-brand hover:bg-viscum-leaf-soft/40 ${THUMB_ASPECT}`}
            style={{ aspectRatio: "1280 / 670" }}
          >
            <span className="text-[14px] font-medium text-viscum-brand">
              画像を選ぶ
            </span>
            <span className="text-[11px]">JPG / PNG / WebP など · デモは5MBまで</span>
          </button>
        )}
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
          背景と、「どこまで見れば十分か」。タイトルと被らない範囲で短く。
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] leading-relaxed text-viscum-ink focus:border-viscum-brand focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium text-viscum-ink">
          メンターへのお願い
        </label>
        {!compOn ? (
          <>
            <p className="mt-0.5 text-[12px] leading-relaxed text-viscum-muted">
              見てほしいところの入口です。書いていない論点を書かれても大丈夫（採用・チップはシーダーが選びます）。コンペにしなくても書けます。
            </p>
            <textarea
              value={focusNote}
              onChange={(e) => setFocusNote(e.target.value)}
              rows={2}
              placeholder="例: 冒頭1秒で何の製品か分かるか"
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] leading-relaxed text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none"
            />
          </>
        ) : (
          <p className="mt-0.5 text-[12px] leading-relaxed text-viscum-muted">
            コンペON中は下の「コース」でおすすめ質問を足場にします。編集・追加・削除できます。
          </p>
        )}
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
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={compOn}
            onChange={(e) => {
              const on = e.target.checked;
              setCompOn(on);
              if (on && promptList.length === 0) {
                setQuestions([...course.questions]);
              }
            }}
            className="mt-1"
          />
          <span>
            <span className="block text-[14px] font-medium text-viscum-ink">
              コメントコンペにする
            </span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-viscum-muted">
              コースを選んで、おすすめ質問を足場に反応を募集します。必須ではありません。無料のまま並べるだけでもOKです。
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-viscum-muted">いまの見え方：</span>
          <StatusBadge
            status={status}
            prizeYen={compOn ? prizeYen : undefined}
          />
          {compOn && (
            <span className="text-[12px] text-viscum-ink">{course.name}</span>
          )}
        </div>

        {compOn && (
          <div className="space-y-4 border-t border-viscum-line pt-4">
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
                {title.trim() || "（タイトルがヘッドラインになります）"}
              </p>
              <p className="mt-1 text-[12px] text-viscum-ink">
                {course.name} · チップ {formatYen(prizeYen)} · 締切 あと約
                {closesInDays}日
              </p>
            </div>

            <div>
              <p className="text-[13px] font-medium text-viscum-ink">コース</p>
              <p className="mt-0.5 text-[12px] text-viscum-muted">
                価格で質を保証しません。集め方の型が変わります。選ぶとおすすめ質問に戻します。
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {SEED_COURSES.map((c) => {
                  const on = courseId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => applyCourse(c.id)}
                      className={`rounded-md border px-3 py-2.5 text-left transition ${
                        on
                          ? "border-viscum-berry bg-viscum-berry text-white"
                          : "border-viscum-line bg-white/70 text-viscum-ink hover:border-viscum-berry"
                      }`}
                    >
                      <span className="block text-[13px] font-medium">
                        {c.name}
                      </span>
                      <span
                        className={`mt-0.5 block text-[12px] ${on ? "text-white/90" : "text-viscum-muted"}`}
                      >
                        {formatYen(c.yen)}
                      </span>
                      <span
                        className={`mt-1 block text-[11px] leading-snug ${on ? "text-white/85" : "text-viscum-muted"}`}
                      >
                        {c.purpose}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-viscum-muted">
                下限 ¥5,000。払うのは採用したあと（デモでは決済しません）。
                {courseId === "boost"
                  ? " ブーストは下の「公開ブースト」とセットがおすすめです。"
                  : ""}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-viscum-ink">
                  聞くこと（足場）
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
                テンプレは足場です。文言を変えても、空欄を足しても大丈夫（最大
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
          </div>
        )}
      </div>

      <div className="rounded-lg border border-viscum-line bg-viscum-paper-2/40 px-4 py-4 space-y-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={extReviewOn}
            onChange={(e) => setExtReviewOn(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block text-[14px] font-medium text-viscum-ink">
              公開ブーストも頼む
            </span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-viscum-muted">
              App Store や Chrome
              拡張、SNSなど、外の公開の場所へ正直な反応や投稿を残してもらいます。合格した人には固定謝礼を確実に払います（検品後払い。前払い確約はしません）。やらせや、触ってもいない星だけは不合格。場内コンペと同時でもOKです。媒体枠の「広告」ではなく、押し上げのブーストです。
            </span>
          </span>
        </label>

        {extReviewOn && (
          <div className="space-y-3 border-t border-viscum-line pt-4">
            <div>
              <p className="text-[13px] font-medium text-viscum-ink">
                合格者への固定謝礼（1件あたり）
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {EXT_REVIEW_PRESETS.map((yen) => (
                  <button
                    key={yen}
                    type="button"
                    onClick={() => setExtPrizeYen(yen)}
                    className={`rounded-md border px-3 py-1.5 text-[13px] font-medium transition ${
                      extPrizeYen === yen
                        ? "border-viscum-berry bg-viscum-berry text-white"
                        : "border-viscum-line bg-white/70 text-viscum-ink hover:border-viscum-berry"
                    }`}
                  >
                    {formatYen(yen)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-viscum-muted">
                下限 ¥5,000。合格確定後に支払い（デモでは決済しません）。決済手数料はお支払いに上乗せ（シーダー負担）。
              </p>
            </div>
            <p className="text-[12px] leading-relaxed text-viscum-muted">
              合格の目安（デモ文言）: 実利用したうえで書く／指定ポイントに触れる／テンプレ量産でない／必要な開示がある。不合格は差し戻しまたは不払い。
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-viscum-line px-4 py-3">
        <p className="text-[13px] font-medium text-viscum-ink">直依頼について</p>
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
          「あなたに頼みたい」は、シードしたあとにできます。公開コンペとは別のお願いです。シード完了画面から、サイト内メンターへの指名と外部DM用URLに進めます。
        </p>
      </div>

      <button
        type="submit"
        disabled={!canSave}
        className="w-full rounded-md bg-viscum-berry px-4 py-3 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-45"
      >
        シードする（デモ）
      </button>
      <p className="text-center text-[11px] text-viscum-muted">
        認証・保存はまだありません。見た目と流れの確認用です。
      </p>
    </form>
  );
}
