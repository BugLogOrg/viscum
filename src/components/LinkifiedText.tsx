import type { ReactNode } from "react";

/** http(s) のみ。javascript: 等はリンクにしない */
const URL_RE = /https?:\/\/[^\s<>"'）】」』]+/gi;

function trimTrailingPunct(url: string): { href: string; trail: string } {
  // 日本語句読点・英語の閉じ括弧などは URL から外す
  const m = url.match(/^(.*?)([),.，。、;；:：!?！？]+)?$/);
  if (!m) return { href: url, trail: "" };
  return { href: m[1] ?? url, trail: m[2] ?? "" };
}

/** コメント本文などのプレーンテキスト内 URL を外部リンクにする */
export function LinkifiedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  const re = new RegExp(URL_RE.source, URL_RE.flags);
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    if (start > last) {
      nodes.push(text.slice(last, start));
    }
    const raw = match[0];
    const { href, trail } = trimTrailingPunct(raw);
    if (/^https?:\/\//i.test(href)) {
      nodes.push(
        <a
          key={`u-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium text-viscum-brand underline decoration-viscum-line underline-offset-2 hover:text-viscum-berry-deep hover:decoration-viscum-berry-deep"
          onClick={(e) => e.stopPropagation()}
        >
          {href}
        </a>,
      );
      if (trail) nodes.push(trail);
    } else {
      nodes.push(raw);
    }
    last = start + raw.length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return (
    <span className={className} style={{ whiteSpace: "pre-wrap" }}>
      {nodes.length > 0 ? nodes : text}
    </span>
  );
}
