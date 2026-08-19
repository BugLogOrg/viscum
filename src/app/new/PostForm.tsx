"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  const [seedPlan, setSeedPlan] = useState<SeedPlanId>("free_comment");
  const [questions, setQuestions] = useState<string[]>(() => [
    ...courseById("first_impression").questions,
  ]);
  const [boostCriteria, setBoostCriteria] = useState<string[]>(() => [
    ...PUBLIC_BOOST.criteria,
  ]);
  const [closesInDays, setClosesInDays] = useState(7);
  const [saved, setSaved] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [thumbName, setThumbName] = useState<string | null>(null);
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
      return `公開ブースト · 予算 ${formatYen(extPrizeYen)} · 記入後報告→選んで褒賞`;
    }
    if (compOn) {
      return `${course.name} · 予算 ${formatYen(prizeYen)} · 締切 あと約${closesInDays}日`;
    }
    return "無料コメント · コメント歓迎";
  })();

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

  function shareText() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${DEMO_DETAIL_HREF}`
        : DEMO_DETAIL_HREF;
    const lines: string[] = [];
    if (compOn) {
      lines.push(
        `【VISCUM】${course.name} · 予算 ${formatYen(prizeYen)}`,
      );
    } else if (extReviewOn) {
      lines.push(
        `【VISCUM】公開ブースト · 予算 ${formatYen(extPrizeYen)}（記入後報告→選んで褒賞）`,
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
        "ストア／拡張／SNSなど公開の場所への正直な反応・投稿を募集（記入後に報告。褒賞はシーダーが選ぶ／全員払いではない）。",
      );
      const crit = boostCriteria.map((c) => c.trim()).filter(Boolean);
      if (crit.length > 0) {
        lines.push("", ...crit.map((c) => `・${c}`));
      }
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
              {course.name} · 予算 {formatYen(prizeYen)} · 締切 あと約
              {closesInDays}日
            </p>
          )}
          {extReviewOn && (
            <p className="text-[13px] text-viscum-ink">
              公開ブースト · 予算 {formatYen(extPrizeYen)} · 記入後報告→選んで褒賞
            </p>
          )}
          {!compOn && !extReviewOn && (
            <p className="text-[13px] text-viscum-ink">無料コメント · コメント歓迎</p>
          )}
        </div>

        <div className="rounded-lg border border-viscum-berry/30 bg-viscum-berry/5 px-4 py-4 space-y-3">
          <p className="text-[14px] font-medium text-viscum-berry-deep">
            共有する（拡散が候補を集める）
          </p>
          <p className="text-[12px] leading-relaxed text-viscum-muted">
            足場の質問はそのままでも大丈夫です。気づいたことがあれば、追加でアレンジしても構いません——そちらの方が、シーダーの参考になることもあります。あとはURLを広げて候補を集めましょう。
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
              見てほしいところの入口です。書いていない論点を書かれても大丈夫（採用・褒賞はシーダーが選びます）。無料コメントでも書けます。
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
            初見レビュー／改善提案を選ぶと、下でおすすめ質問を足場にします。編集・追加・削除できます。
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
                テンプレは足場です。そのまま答えても大丈夫。気づいたことがあれば追加でアレンジしても構いません（最大
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
                  募集の目安（足場）
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
                全員払いではありません。虚偽・未使用・禁止違反は除外の目安。決済手数料はお支払いに上乗せ（シーダー負担）。人数保証・星の売買はしません。
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-viscum-line px-4 py-3">
        <p className="text-[13px] font-medium text-viscum-ink">直依頼について</p>
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
          「あなたに頼みたい」は、シードしたあとにできます。公開の募集／コンペとは別のお願いです。シード完了画面から進めます。
        </p>
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
          {title.trim() || "（タイトルがヘッドラインになります）"}
        </p>
        <p className="mt-1 text-[12px] text-viscum-ink">{previewMeta}</p>
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
