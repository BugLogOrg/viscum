/** 作品コメントの文中画像（ブロック／Markdown） */

export type CommentTextBlock = {
  id: string;
  type: "text";
  text: string;
};

export type CommentImageBlock = {
  id: string;
  type: "image";
  previewUrl: string;
  finalUrl?: string;
  caption: string;
  uploading?: boolean;
  error?: string;
};

export type CommentBlock = CommentTextBlock | CommentImageBlock;

export type RenderBlock =
  | { type: "text"; text: string }
  | { type: "image"; url: string; alt: string };

const IMG_MD = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

export function newBlockId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyComposeBlocks(): CommentBlock[] {
  return [{ id: newBlockId("t"), type: "text", text: "" }];
}

/** 投稿用: 本文Markdown＋imageUrls */
export function serializeCommentBlocks(blocks: CommentBlock[]): {
  body: string;
  imageUrls: string[];
} {
  const parts: string[] = [];
  const imageUrls: string[] = [];
  for (const b of blocks) {
    if (b.type === "text") {
      const t = b.text.replace(/\s+$/g, "").replace(/^\s+/g, "");
      if (t) parts.push(t);
      continue;
    }
    if (!b.finalUrl || b.uploading || b.error) continue;
    imageUrls.push(b.finalUrl);
    const alt = b.caption.trim() || "画像";
    parts.push(`![${alt}](${b.finalUrl})`);
  }
  return { body: parts.join("\n\n"), imageUrls };
}

/** 表示用: Markdown画像を文中に展開。旧データは末尾に imageUrls */
export function parseCommentBody(
  body: string,
  fallbackImageUrls?: string[],
): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const re = new RegExp(IMG_MD.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  const foundUrls = new Set<string>();

  while ((m = re.exec(body)) !== null) {
    if (m.index > last) {
      const text = body.slice(last, m.index).trim();
      if (text) blocks.push({ type: "text", text });
    }
    const alt = m[1] || "画像";
    const url = m[2];
    foundUrls.add(url);
    blocks.push({ type: "image", url, alt });
    last = m.index + m[0].length;
  }

  const rest = body.slice(last).trim();
  if (rest) blocks.push({ type: "text", text: rest });

  if (foundUrls.size === 0 && fallbackImageUrls?.length) {
    if (blocks.length === 0 && body.trim()) {
      blocks.push({ type: "text", text: body.trim() });
    }
    for (const url of fallbackImageUrls) {
      blocks.push({ type: "image", url, alt: "画像" });
    }
  }

  if (blocks.length === 0 && body.trim()) {
    blocks.push({ type: "text", text: body.trim() });
  }

  return blocks;
}

export function countImagesInBlocks(blocks: CommentBlock[]): number {
  return blocks.filter((b) => b.type === "image").length;
}
