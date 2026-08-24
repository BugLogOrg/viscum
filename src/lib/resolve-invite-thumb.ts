"use client";

import { upload } from "@vercel/blob/client";
import {
  COMMENT_IMAGE_TARGET_CHARS,
  compressImageForComment,
} from "@/lib/comment-images";
import { fetchBlobConfigured } from "@/lib/upload-comment-image";
import { sanitizeInviteThumbUrl } from "@/lib/request-dm-serialize";

/**
 * 直依頼招待用サムネを Neon に載せられる形へ。
 * Blob があれば https、なければ小さめ data URL。
 */
export async function resolveInviteThumbUrl(
  raw?: string | null,
): Promise<string | undefined> {
  const t = raw?.trim();
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) {
    return sanitizeInviteThumbUrl(t);
  }
  if (!t.startsWith("data:image/") && !t.startsWith("blob:")) {
    return undefined;
  }

  try {
    const res = await fetch(t);
    const blob = await res.blob();
    if (!blob.type.startsWith("image/") && !t.startsWith("data:image/")) {
      return sanitizeInviteThumbUrl(t.startsWith("data:image/") ? t : undefined);
    }
    const file = new File([blob], `invite-thumb-${Date.now()}.jpg`, {
      type: blob.type.startsWith("image/") ? blob.type : "image/jpeg",
    });
    const configured = await fetchBlobConfigured();
    if (configured) {
      const compressed = await compressImageForComment(file);
      const uploaded = await upload(
        `invites/${Date.now()}-${compressed.name}`,
        compressed,
        {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          contentType: "image/jpeg",
        },
      );
      return sanitizeInviteThumbUrl(uploaded.url);
    }

    // Blob 未設定時: 既に data URL ならそのまま（上限内）
    if (t.startsWith("data:image/")) {
      return sanitizeInviteThumbUrl(t);
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
    if (dataUrl.length > COMMENT_IMAGE_TARGET_CHARS) return undefined;
    return sanitizeInviteThumbUrl(dataUrl);
  } catch {
    return sanitizeInviteThumbUrl(t.startsWith("data:image/") ? t : undefined);
  }
}
