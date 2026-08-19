"use client";

import { useState } from "react";
import type { PortfolioTradeLabel } from "@/data/dummy-portfolio-wall";
import { addLocalPortfolioWallPost } from "@/lib/local-portfolio-wall";

const TRADE_LABELS: PortfolioTradeLabel[] = [
  "お礼",
  "申立",
  "決着",
  "やりとり",
];

/** デモ投稿フォーム。一覧はサーバー側 PortfolioWall が描画 */
export function PortfolioWallCompose({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"trade" | "guest">("guest");
  const [tradeLabel, setTradeLabel] =
    useState<PortfolioTradeLabel>("お礼");
  const [author, setAuthor] = useState("you");
  const [body, setBody] = useState("");
  const [note, setNote] = useState<string | null>(null);

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
    setOpen(false);
    setNote(
      "端末内に保存しました。デモ一覧はサーバーのダミーが正本なので、リロード後はダミー＋ローカルの合成はまだ未接続です。",
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-viscum-line bg-viscum-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-viscum-ink hover:border-viscum-brand"
      >
        {open ? "閉じる" : "書く"}
      </button>

      {open && (
        <form
          onSubmit={onSubmit}
          className="absolute right-0 z-10 mt-2 w-[min(100vw-2rem,22rem)] space-y-2 rounded-lg border border-viscum-line bg-viscum-paper p-3 shadow-md"
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
            投稿する（デモ）
          </button>
        </form>
      )}

      {note && !open && (
        <p className="mt-2 max-w-[14rem] text-[10px] leading-snug text-viscum-muted">
          {note}
        </p>
      )}
    </div>
  );
}
