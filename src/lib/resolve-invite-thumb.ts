"use client";

import { upload } from "@vercel/blob/client";
import { compressImageForComment } from "@/lib/comment-images";
import { fetchBlobConfigured } from "@/lib/upload-comment-image";
import { sanitizeInviteThumbUrl } from "@/lib/request-dm-serialize";

/**
 * 直依頼招待用サムネを Neon に載せられる形へ。
 * Blob（https）のみ。data URL フォールバックはしない（DM読み込みが死ぬ）。
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
      return undefined;
    }
    const file = new File([blob], `invite-thumb-${Date.now()}.jpg`, {
      type: blob.type.startsWith("image/") ? blob.type : "image/jpeg",
    });
    const configured = await fetchBlobConfigured();
    if (!configured) {
      // Blob 未設定ならサムネ無し（data URL を Neon に載せない）
      return undefined;
    }
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
  } catch {
    return undefined;
  }
}
