"use client";

import { upload } from "@vercel/blob/client";
import {
  COMMENT_IMAGE_TARGET_CHARS,
  compressImageForComment,
} from "@/lib/comment-images";
import { fetchBlobConfigured } from "@/lib/upload-comment-image";

/**
 * シード保存用サムネ。Blob があれば https URL、なければ小さめ data URL。
 * Neon に巨大 data URL を置かない（フィード遅延の主因）。
 */
export async function resolveWorkThumbForSave(
  objectUrl: string | null | undefined,
): Promise<string | null> {
  const src = objectUrl?.trim();
  if (!src) return null;

  try {
    const res = await fetch(src);
    const blob = await res.blob();
    if (!blob.type.startsWith("image/") && blob.size === 0) return null;

    const file = new File([blob], `work-thumb-${Date.now()}.jpg`, {
      type: blob.type.startsWith("image/") ? blob.type : "image/jpeg",
    });

    const configured = await fetchBlobConfigured();
    if (configured) {
      const compressed = await compressImageForComment(file);
      const uploaded = await upload(
        `works/${Date.now()}-${compressed.name}`,
        compressed,
        {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          contentType: "image/jpeg",
        },
      );
      return uploaded.url;
    }

    // Blob 未設定: 圧縮して短い data URL のみ許可
    const compressed = await compressImageForComment(file);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("read"));
      r.readAsDataURL(compressed);
    });
    if (dataUrl.length > COMMENT_IMAGE_TARGET_CHARS) return null;
    return dataUrl;
  } catch {
    return null;
  }
}
