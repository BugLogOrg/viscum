"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { SiteHeader } from "@/components/SiteHeader";
import { THUMB_ASPECT } from "@/components/WorkFeedRow";
import type { Work } from "@/data/dummy-works";
import { DirectRequestForm, DirectRequestPitchFields } from "@/app/w/[id]/request/DirectRequestForm";
import {
  addLocalSeed,
  readLocalSeeds,
  workFromLocalSeed,
  writeLocalSeeds,
} from "@/lib/local-seeds";
import {
  displayAccountName,
  readLocalProfile,
} from "@/lib/local-profile";

const DRAFT_WORK_ID = "__draft_drq__";

/**
 * 直依頼レーン（ADR-038）— 一枚フォーム。
 * 作品メモ・金額・相手・案内文コピペまで同じ画面。棚公開ステップなし。
 */
export default function NewDirectRequestPage() {
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("https://");
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [thumbDataUrl, setThumbDataUrl] = useState<string | undefined>();
  const [thumbSourceUrl, setThumbSourceUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [persistedId, setPersistedId] = useState<string | null>(null);
  const [pitch, setPitch] = useState("");
  const [checklist, setChecklist] = useState<string[]>([""]);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const persistLock = useRef<Promise<Work | null> | null>(null);

  function isUsableExternalUrl(raw: string): boolean {
    const t = raw.trim();
    if (t.length <= 8 || t === "https://" || t === "http://") return false;
    try {
      const u = new URL(t);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  const metaReady =
    title.trim().length > 0 && isUsableExternalUrl(externalUrl);
  const handle = session?.user?.handle?.replace(/^@/, "").trim();

  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
      if (thumbSourceUrl) URL.revokeObjectURL(thumbSourceUrl);
      if (cropSrc && cropSrc !== thumbSourceUrl) URL.revokeObjectURL(cropSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onThumbPick(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPendingName(file.name);
    setCropSrc(url);
    setCropOpen(true);
  }

  function onCropCancel() {
    setCropOpen(false);
    if (cropSrc && cropSrc !== thumbSourceUrl) URL.revokeObjectURL(cropSrc);
    setCropSrc(thumbSourceUrl);
    setPendingName(null);
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
    setPendingName(null);
    setCropOpen(false);
    void (async () => {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(blob);
        });
        setThumbDataUrl(
          dataUrl && dataUrl.length > 450_000 ? undefined : dataUrl,
        );
      } catch {
        setThumbDataUrl(undefined);
      }
    })();
  }

  const checklistClean = useMemo(
    () => checklist.map((s) => s.trim()).filter(Boolean),
    [checklist],
  );

  const draftWork: Work = useMemo(
    () => ({
      id: persistedId ?? DRAFT_WORK_ID,
      title: title.trim().slice(0, 100) || "（タイトル未入力）",
      tagline: (title.trim().slice(0, 100) || "直依頼").slice(0, 100),
      seeder: handle || "anon",
      tags: [],
      status: "none",
      plan: "free_comment",
      hoursAgo: 0,
      description: description.trim(),
      prompts: checklistClean.length ? checklistClean : undefined,
      externalUrl: isUsableExternalUrl(externalUrl)
        ? externalUrl.trim()
        : "",
      thumbTone: "leaf",
      thumbUrl: thumbDataUrl || thumbUrl || undefined,
      comments: [],
      sukiCount: 0,
      bookmarkCount: 0,
    }),
    [
      persistedId,
      title,
      handle,
      description,
      checklistClean,
      externalUrl,
      thumbDataUrl,
      thumbUrl,
    ],
  );

  const ensureWork = useCallback(async (): Promise<Work | null> => {
    if (!handle || !metaReady) return null;
    const focusNote =
      checklistClean.length > 0 ? checklistClean.join("\n") : undefined;
    if (persistedId) {
      const seeds = readLocalSeeds();
      const i = seeds.findIndex((s) => s.id === persistedId);
      if (i >= 0) {
        seeds[i] = {
          ...seeds[i],
          title: title.trim().slice(0, 100),
          description: description.trim(),
          externalUrl: externalUrl.trim(),
          focusNote,
          thumbDataUrl: thumbDataUrl ?? seeds[i].thumbDataUrl,
          updatedAt: new Date().toISOString(),
        };
        writeLocalSeeds(seeds);
      }
      return {
        ...draftWork,
        id: persistedId,
        title: title.trim().slice(0, 100),
        description: description.trim(),
        externalUrl: externalUrl.trim(),
        prompts: checklistClean.length ? checklistClean : undefined,
      };
    }
    if (persistLock.current) return persistLock.current;

    persistLock.current = (async () => {
      try {
        const seederHandle = handle;
        const fromSession =
          session?.user?.name?.trim() &&
          session.user.name.trim().toLowerCase() !== seederHandle.toLowerCase()
            ? session.user.name.trim()
            : undefined;
        const seederAccountName =
          fromSession ||
          displayAccountName(seederHandle, readLocalProfile(seederHandle));
        const row = addLocalSeed({
          lane: "direct_request",
          seederHandle,
          seederAccountName:
            seederAccountName.toLowerCase() !== seederHandle.toLowerCase()
              ? seederAccountName
              : undefined,
          title: title.trim().slice(0, 100),
          description: description.trim(),
          externalUrl: externalUrl.trim(),
          focusNote,
          tags: [],
          status: "none",
          seedPlan: "free_comment",
          planLabel: "直依頼",
          thumbDataUrl,
          listedOnShelf: false,
        });
        setPersistedId(row.id);
        return workFromLocalSeed(row);
      } finally {
        persistLock.current = null;
      }
    })();

    return persistLock.current;
  }, [
    handle,
    metaReady,
    persistedId,
    draftWork,
    title,
    description,
    externalUrl,
    checklistClean,
    session?.user?.name,
    thumbDataUrl,
  ]);

  if (status === "loading") {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/new" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </main>
      </BrowseChrome>
    );
  }

  if (!handle) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/new" hideOnMd hidePostCta />
        <main className="max-w-lg space-y-4 px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">直依頼</h1>
          <p className="text-[14px] text-viscum-muted">
            指名依頼にはログイン（英語ID）が必要です。
          </p>
          <Link
            href="/login?callbackUrl=/new/request"
            className="inline-flex rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white"
          >
            ログインへ
          </Link>
        </main>
      </BrowseChrome>
    );
  }

  return (
    <BrowseChrome>
      <SiteHeader backHref="/new" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-8 px-4 py-6">
        <div>
          <p className="text-xs text-viscum-muted">指名して頼む</p>
          <h1 className="mt-1 text-xl font-semibold text-viscum-ink">
            特定の人に頼む
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-viscum-muted">
            シード棚には出ません。相手への案内文までこの画面で揃えます。
          </p>
          <p className="mt-2 text-[12px]">
            <Link href="/new" className="text-viscum-brand underline">
              ← 入り口に戻る
            </Link>
          </p>
        </div>

        <section className="space-y-5">
          <h2 className="text-[14px] font-semibold text-viscum-ink">
            1. 見てほしいもの
          </h2>
          <div>
            <label className="block text-[13px] font-medium text-viscum-ink">
              タイトル <span className="text-viscum-berry">必須</span>
            </label>
            <p className="mt-0.5 text-[12px] text-viscum-muted">
              相手に渡すヘッドライン。案内文と着地の先頭に出ます。
            </p>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              rows={2}
              maxLength={100}
              placeholder="何を見てほしいか"
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[15px] leading-snug text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none"
            />
            <p className="mt-1 text-right text-[11px] text-viscum-muted">
              {title.length}/100
            </p>
          </div>

          <DirectRequestPitchFields
            mode="greeting"
            message={pitch}
            onMessageChange={setPitch}
            prompts={checklist}
            onPromptsChange={setChecklist}
          />

          <div>
            <p className="text-[13px] font-medium text-viscum-ink">
              サムネイル{" "}
              <span className="font-normal text-viscum-muted">任意・推奨</span>
            </p>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onThumbPick(e.target.files?.[0])}
            />
            <div className="mt-1.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="rounded-md border border-viscum-line bg-white px-3 py-1.5 text-[13px] text-viscum-ink hover:bg-viscum-paper-2"
              >
                {thumbUrl ? "画像を変更" : "画像を選ぶ"}
              </button>
              {thumbUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    if (thumbUrl) URL.revokeObjectURL(thumbUrl);
                    setThumbUrl(null);
                    setThumbDataUrl(undefined);
                  }}
                  className="text-[13px] text-viscum-muted underline"
                >
                  外す
                </button>
              ) : null}
            </div>
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
            ) : null}
            {pendingName ? (
              <p className="mt-1 text-[11px] text-viscum-muted">{pendingName}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-viscum-ink">
              概要{" "}
              <span className="font-normal text-viscum-muted">任意</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="相手が読む短い説明"
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] text-viscum-ink focus:border-viscum-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-viscum-ink">
              見てほしいURL <span className="text-viscum-berry">必須</span>
            </label>
            <p className="mt-0.5 text-[12px] text-viscum-muted">
              相手に開いてほしいページ・作品・デモのURLです（ログイン後に表示）。
            </p>
            <input
              type="url"
              required
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://"
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] text-viscum-ink focus:border-viscum-brand focus:outline-none"
            />
          </div>

          <DirectRequestPitchFields
            mode="prompts"
            message={pitch}
            onMessageChange={setPitch}
            prompts={checklist}
            onPromptsChange={setChecklist}
          />
        </section>

        <section className="space-y-3 border-t border-viscum-line pt-6">
          <h2 className="text-[14px] font-semibold text-viscum-ink">
            2. 金額・相手・連絡文
          </h2>
          <DirectRequestForm
            work={draftWork}
            ensureWork={ensureWork}
            metaReady={metaReady}
            showWorkCard={false}
            pitchFieldsExternal
            message={pitch}
            onMessageChange={setPitch}
            prompts={checklist}
            onPromptsChange={setChecklist}
          />
        </section>

        <p className="text-center text-[11px] text-viscum-muted">
          この内容はシード棚に公開されません。
        </p>

        {cropSrc && (
          <ImageCropDialog
            src={cropSrc}
            open={cropOpen}
            onCancel={onCropCancel}
            onApply={onCropApply}
          />
        )}
      </main>
    </BrowseChrome>
  );
}
