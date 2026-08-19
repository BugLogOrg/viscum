"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getDummyPortfolioWall,
  type PortfolioTradeLabel,
  type PortfolioWallPost,
} from "@/data/dummy-portfolio-wall";
import { formatHoursAgo } from "@/data/dummy-works";
import { LinkifiedText } from "@/components/LinkifiedText";
import {
  addLocalPortfolioWallPost,
  readLocalPortfolioWall,
} from "@/lib/local-portfolio-wall";

const TRADE_LABELS: PortfolioTradeLabel[] = [
  "お礼",
  "申立",
  "決着",
  "やりとり",
];

function KindBadge({ post }: { post: PortfolioWallPost }) {
  if (post.kind === "guest") {
    return (
      <span className="rounded bg-viscum-line/70 px-1.5 py-0.5 text-[10px] font-medium text-viscum-muted">
        一見
      </span>
    );
  }
  return (
    <span className="rounded bg-viscum-berry/15 px-1.5 py-0.5 text-[10px] font-medium text-viscum-berry-deep">
      取引{post.tradeLabel ? ` · ${post.tradeLabel}` : ""}
    </span>
  );
}

export function PortfolioWall({ handle }: { handle: string }) {
  const seed = useMemo(() => getDummyPortfolioWall(handle), [handle]);
  const [local, setLocal] = useState<PortfolioWallPost[]>([]);
  const [kind, setKind] = useState<"trade" | "guest">("guest");
  const [tradeLabel, setTradeLabel] =
    useState<PortfolioTradeLabel>("お礼");
  const [author, setAuthor] = useState("you");
  const [body, setBody] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    setLocal(readLocalPortfolioWall(handle));
  }, [handle]);

  const posts = useMemo(() => {
    const ids = new Set(local.map((p) => p.id));
    const merged = [...local, ...seed.filter((p) => !ids.has(p.id))];
    return merged.sort((a, b) => a.hoursAgo - b.hoursAgo);
  }, [local, seed]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    addLocalPortfolioWallPost(handle, {
      kind,
      tradeLabel: kind === "trade" ? tradeLabel : undefined,
      author,
      body,
    });
    setBody("");
    setComposeOpen(false);
    setLocal(readLocalPortfolioWall(handle));
  }

  return (
    <section
      className="border-b border-viscum-line"
      aria-label="ポートフォリオの書き込み"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 px-4 pt-4">
        <div>
          <p className="text-[13px] font-medium text-viscum-ink">
            書き込み · {posts.length}
          </p>
          <p className="mt-1 max-w-md text-[11px] leading-snug text-viscum-muted">
            取引メモは全文公開（自浄のため）。一見さんも可。運営は原則裁定しません（デモ）。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComposeOpen((v) => !v)}
          className="shrink-0 rounded-md border border-viscum-line bg-viscum-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-viscum-ink hover:border-viscum-brand"
        >
          {composeOpen ? "閉じる" : "書く"}
        </button>
      </div>

      {composeOpen && (
        <form
          onSubmit={onSubmit}
          className="mx-4 mt-3 space-y-2 rounded-lg border border-viscum-line bg-viscum-paper-2/60 px-3 py-3"
        >
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1.5 text-[12px] text-viscum-ink">
              <input
                type="radio"
                name="wall-kind"
                checked={kind === "guest"}
                onChange={() => setKind("guest")}
              />
              一見
            </label>
            <label className="flex items-center gap-1.5 text-[12px] text-viscum-ink">
              <input
                type="radio"
                name="wall-kind"
                checked={kind === "trade"}
                onChange={() => setKind("trade")}
              />
              取引
            </label>
            {kind === "trade" && (
              <select
                value={tradeLabel}
                onChange={(e) =>
                  setTradeLabel(e.target.value as PortfolioTradeLabel)
                }
                className="rounded border border-viscum-line bg-white px-1.5 py-0.5 text-[12px]"
              >
                {TRADE_LABELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
          </div>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="表示名"
            className="w-full rounded border border-viscum-line bg-white px-2 py-1.5 text-[13px]"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={
              kind === "guest"
                ? "一見さんの所見・一言（デモ）"
                : "取引メモ全文（お礼・申立・決着など）"
            }
            className="w-full resize-y rounded border border-viscum-line bg-white px-2 py-1.5 text-[13px] leading-relaxed"
          />
          <button
            type="submit"
            disabled={!body.trim()}
            className="rounded-md bg-viscum-brand px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
          >
            投稿する（デモ・端末内）
          </button>
        </form>
      )}

      {posts.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-viscum-muted">
          まだ書き込みはありません。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-viscum-line border-t border-viscum-line">
          {posts.map((p) => (
            <li key={p.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <KindBadge post={p} />
                <Link
                  href={`/u/${encodeURIComponent(p.author)}`}
                  className="text-[13px] font-medium text-viscum-ink hover:underline"
                >
                  @{p.author}
                </Link>
                <span className="text-[11px] text-viscum-muted">
                  {formatHoursAgo(p.hoursAgo)}
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-viscum-ink">
                <LinkifiedText text={p.body} />
              </p>
              {p.workId && (
                <p className="mt-1.5 text-[11px] text-viscum-muted">
                  案件：
                  <Link
                    href={`/w/${encodeURIComponent(p.workId)}`}
                    className="text-viscum-brand hover:underline"
                  >
                    {p.workTitle ?? p.workId}
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
