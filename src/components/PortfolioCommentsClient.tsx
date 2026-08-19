"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { PortfolioWallPost } from "@/data/dummy-portfolio-wall";
import { formatHoursAgo } from "@/data/dummy-works";
import { LinkifiedText } from "@/components/LinkifiedText";
import {
  addLocalPortfolioWallPost,
  readLocalPortfolioWall,
} from "@/lib/local-portfolio-wall";

export function PortfolioCommentsClient({
  handle,
  initialPosts,
}: {
  handle: string;
  initialPosts: PortfolioWallPost[];
}) {
  const { data: session, status } = useSession();
  const [local, setLocal] = useState<PortfolioWallPost[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [body, setBody] = useState("");

  useEffect(() => {
    setLocal(readLocalPortfolioWall(handle));
  }, [handle]);

  const posts = useMemo(() => {
    const ids = new Set(local.map((p) => p.id));
    return [...local, ...initialPosts.filter((p) => !ids.has(p.id))].sort(
      (a, b) => a.hoursAgo - b.hoursAgo,
    );
  }, [local, initialPosts]);

  const loggedIn = status === "authenticated" && !!session?.user?.handle;
  const myHandle = session?.user?.handle?.replace(/^@/, "") ?? "";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedIn || !body.trim()) return;
    addLocalPortfolioWallPost(handle, { author: myHandle, body });
    setBody("");
    setComposeOpen(false);
    setLocal(readLocalPortfolioWall(handle));
  }

  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/u/${handle}`)}`;

  return (
    <section
      className="border-b border-viscum-line"
      aria-label="ポートフォリオのコメント"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 px-4 pt-4">
        <div>
          <p className="text-[13px] font-medium text-viscum-ink">
            コメント · {posts.length}
          </p>
          <p className="mt-1 max-w-md text-[11px] leading-snug text-viscum-muted">
            ログインしたコテハンのみ投稿可。全文公開（自浄のため）。運営は原則裁定しません（デモ）。
          </p>
        </div>
        {loggedIn ? (
          <button
            type="button"
            onClick={() => setComposeOpen((v) => !v)}
            className="shrink-0 rounded-md border border-viscum-line bg-viscum-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-viscum-ink hover:border-viscum-brand"
          >
            {composeOpen ? "閉じる" : "コメントする"}
          </button>
        ) : (
          <Link
            href={loginHref}
            className="shrink-0 rounded-md border border-viscum-line bg-viscum-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-viscum-ink hover:border-viscum-brand"
          >
            {status === "loading" ? "…" : "ログインしてコメント"}
          </Link>
        )}
      </div>

      {composeOpen && loggedIn && (
        <form
          onSubmit={onSubmit}
          className="mx-4 mt-3 space-y-2 rounded-lg border border-viscum-line bg-viscum-paper-2/60 px-3 py-3"
        >
          <p className="text-[12px] text-viscum-ink">
            投稿者{" "}
            <span className="font-medium">@{myHandle}</span>
            <span className="ml-1 text-viscum-muted">（コテハン・変更不可）</span>
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="コメントを書く…"
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
          まだコメントはありません。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-viscum-line border-t border-viscum-line">
          {posts.map((p) => (
            <li key={p.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
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
