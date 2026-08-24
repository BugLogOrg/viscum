"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BrowseChrome } from "@/components/BrowseChrome";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { SiteHeader } from "@/components/SiteHeader";
import { THUMB_ASPECT } from "@/components/WorkFeedRow";
import { addLocalSeed } from "@/lib/local-seeds";
import {
  displayAccountName,
  readLocalProfile,
} from "@/lib/local-profile";

/**
 * 直依頼レーン（ADR-038）。
 * コース／公開ブーストは出さない。保存後は直依頼フォームへ（棚公開ステップなし）。
 */
export default function NewDirectRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("https://");
  const [saving, setSaving] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [thumbSourceUrl, setThumbSourceUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const canSave = title.trim().length > 0;
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
  }

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
      <main className="max-w-lg px-4 py-6">
        <p className="text-xs text-viscum-muted">指名して頼む</p>
        <h1 className="mt-1 text-xl font-semibold text-viscum-ink">
          直依頼用の作品メモ
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-viscum-muted">
          棚には出ません（別ID）。相手に見せるタイトルと概要だけ先に残し、次の画面で相手と金額を決めます。
        </p>
        <p className="mt-2 text-[12px]">
          <Link href="/new" className="text-viscum-brand underline">
            ← 入り口に戻る
          </Link>
        </p>

        <form
          className="mt-6 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSave || saving) return;
            setSaving(true);
            void (async () => {
              try {
                let thumbDataUrl: string | undefined;
                if (thumbUrl) {
                  try {
                    const blob = await fetch(thumbUrl).then((r) => r.blob());
                    thumbDataUrl = await new Promise<string>((resolve, reject) => {
                      const fr = new FileReader();
                      fr.onload = () => resolve(String(fr.result));
                      fr.onerror = () => reject(fr.error);
                      fr.readAsDataURL(blob);
                    });
                    if (thumbDataUrl && thumbDataUrl.length > 450_000) {
                      thumbDataUrl = undefined;
                    }
                  } catch {
                    /* ignore */
                  }
                }
                const seederHandle = handle;
                const fromSession =
                  session?.user?.name?.trim() &&
                  session.user.name.trim().toLowerCase() !==
                    seederHandle.toLowerCase()
                    ? session.user.name.trim()
                    : undefined;
                const seederAccountName =
                  fromSession ||
                  displayAccountName(
                    seederHandle,
                    readLocalProfile(seederHandle),
                  );
                const row = addLocalSeed({
                  lane: "direct_request",
                  seederHandle,
                  seederAccountName:
                    seederAccountName.toLowerCase() !==
                    seederHandle.toLowerCase()
                      ? seederAccountName
                      : undefined,
                  title: title.trim(),
                  description: description.trim(),
                  externalUrl:
                    externalUrl.trim() === "https://"
                      ? ""
                      : externalUrl.trim(),
                  tags: [],
                  status: "none",
                  seedPlan: "free_comment",
                  planLabel: "直依頼",
                  thumbDataUrl,
                  listedOnShelf: false,
                });
                router.push(`/w/${row.id}/request`);
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
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
              placeholder="何を見てほしいか。相手に渡すヘッドライン"
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[15px] leading-snug text-viscum-ink placeholder:text-viscum-muted focus:border-viscum-brand focus:outline-none"
            />
          </div>

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
          </div>

          <div>
            <label className="block text-[13px] font-medium text-viscum-ink">
              概要{" "}
              <span className="font-normal text-viscum-muted">任意</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="相手が読む短い説明。詳しいお願いは次の画面で。"
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] text-viscum-ink focus:border-viscum-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-viscum-ink">
              外部URL{" "}
              <span className="font-normal text-viscum-muted">任意</span>
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-[14px] text-viscum-ink focus:border-viscum-brand focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!canSave || saving}
            className="w-full rounded-md bg-viscum-berry px-4 py-3 text-sm font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-45"
          >
            {saving ? "保存中…" : "次へ（相手と金額を決める）"}
          </button>
          <p className="text-center text-[11px] text-viscum-muted">
            このメモは棚に公開されません。IDも棚シードとは別です。
          </p>
        </form>

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
