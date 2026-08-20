"use client";

import { upload } from "@vercel/blob/client";
import {
  COMMENT_IMAGE_TARGET_CHARS,
  MAX_COMMENT_IMAGES,
  compressImageForComment,
  fileToCommentDataUrl,
} from "@/lib/comment-images";

export type CommentImageSlot = {
  id: string;
  /** 表示用（object URL または data URL または Blob URL） */
  previewUrl: string;
  /** 投稿に載せる最終URL（Blob or data URL） */
  finalUrl?: string;
  uploading?: boolean;
  error?: string;
};

let blobConfiguredCache: boolean | null = null;

export async function fetchBlobConfigured(): Promise<boolean> {
  if (blobConfiguredCache != null) return blobConfiguredCache;
  try {
    const res = await fetch("/api/blob/upload", { cache: "no-store" });
    const data = (await res.json()) as { configured?: boolean };
    blobConfiguredCache = Boolean(data.configured);
  } catch {
    blobConfiguredCache = false;
  }
  return blobConfiguredCache;
}

/**
 * 1枚追加: 圧縮 → Blob（あれば）or data URL フォールバック
 */
export async function prepareCommentImage(
  file: File,
): Promise<{ previewUrl: string; finalUrl: string }> {
  const compressed = await compressImageForComment(file);
  const configured = await fetchBlobConfigured();

  if (configured) {
    const blob = await upload(
      `comments/${Date.now()}-${compressed.name}`,
      compressed,
      {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        contentType: "image/jpeg",
      },
    );
    return { previewUrl: blob.url, finalUrl: blob.url };
  }

  const dataUrl = await fileToCommentDataUrl(file);
  if (dataUrl.length > COMMENT_IMAGE_TARGET_CHARS) {
    throw new Error("画像が大きすぎます");
  }
  return { previewUrl: dataUrl, finalUrl: dataUrl };
}

export { MAX_COMMENT_IMAGES };
