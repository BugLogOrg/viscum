"use client";

import { LinkifiedText } from "@/components/LinkifiedText";
import { parseCommentBody } from "@/lib/comment-blocks";

/** 文中に画像が混ざるコメント本文 */
export function CommentBody({
  body,
  imageUrls,
}: {
  body: string;
  imageUrls?: string[];
}) {
  const blocks = parseCommentBody(body, imageUrls);

  return (
    <div className="space-y-3">
      {blocks.map((b, i) =>
        b.type === "text" ? (
          <p key={`t-${i}`} className="text-sm leading-relaxed text-viscum-ink">
            <LinkifiedText text={b.text} />
          </p>
        ) : (
          <figure key={`i-${i}`} className="space-y-1">
            <a
              href={b.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-md border border-viscum-line bg-viscum-paper-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.url}
                alt={b.alt}
                className="max-h-72 w-full object-contain bg-viscum-paper"
                loading="lazy"
              />
            </a>
            {b.alt && b.alt !== "画像" && (
              <figcaption className="text-[11px] text-viscum-muted">
                {b.alt}
              </figcaption>
            )}
          </figure>
        ),
      )}
    </div>
  );
}

/** 一覧折りたたみ行用のプレビュー（画像は「[画像]」に置換） */
export function commentPreviewPlain(body: string): string {
  return body
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "［画像］")
    .replace(/\s+/g, " ")
    .trim();
}
