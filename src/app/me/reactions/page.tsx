"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import {
  clearDemoReactions,
  formatReactionStamp,
  hasDemoReactions,
  installDemoReactions,
  readLocalReactions,
  type LocalReaction,
  type ReactionKind,
} from "@/lib/local-reactions";

type Tab = "all" | ReactionKind;

function tabFromQuery(raw: string | null): Tab {
  if (raw === "suki" || raw === "bookmark") return raw;
  return "all";
}

export default function MyReactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      }
    >
      <MyReactionsInner />
    </Suspense>
  );
}

function MyReactionsInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<LocalReaction[]>([]);
  const tab = tabFromQuery(searchParams.get("tab"));
  const [demoOn, setDemoOn] = useState(false);

  function refresh() {
    setRows(
      readLocalReactions().sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
    setDemoOn(hasDemoReactions());
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((r) => r.kind === tab);
  }, [rows, tab]);

  if (status === "loading") {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper px-4 py-10 text-sm text-viscum-muted">
        読み込み中…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
        <SiteHeader backHref="/me" />
        <main className="px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">
            スキ・気になる
          </h1>
          <p className="mt-2 text-[14px] text-viscum-muted">
            ログインすると、自分が押した履歴と打刻が見られます。
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white"
          >
            ログインへ
          </Link>
        </main>
      </div>
    );
  }

  const sukiN = rows.filter((r) => r.kind === "suki").length;
  const bmN = rows.filter((r) => r.kind === "bookmark").length;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref="/me" hidePostCta />
      <main className="space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">
            スキ・気になる
          </h1>
          <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
            一覧に並ぶと近く見えますが、意図は別です。スキ＝好意の打刻、気になる＝あとで戻る保存。通知や再訪は気になる側に寄せます。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg border border-viscum-line bg-white/50 p-0.5 text-[12px]">
            {(
              [
                ["all", `すべて (${rows.length})`, "/me/reactions"],
                ["suki", `スキ (${sukiN})`, "/me/reactions?tab=suki"],
                [
                  "bookmark",
                  `気になる (${bmN})`,
                  "/me/reactions?tab=bookmark",
                ],
              ] as const
            ).map(([key, label, href]) => (
              <Link
                key={key}
                href={href}
                className={`rounded-md px-2.5 py-1.5 ${
                  tab === key
                    ? "bg-viscum-leaf-soft font-medium text-viscum-brand"
                    : "text-viscum-muted"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          {demoOn ? (
            <button
              type="button"
              onClick={() => {
                clearDemoReactions();
                refresh();
              }}
              className="text-[12px] text-viscum-muted underline"
            >
              デモを消す
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                installDemoReactions();
                refresh();
              }}
              className="text-[12px] font-medium text-viscum-brand underline"
            >
              表示デモ
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-viscum-line px-4 py-8 text-center">
            <p className="text-[13px] text-viscum-muted">
              まだありません。作品詳細でスキ／気になるを押すか、表示デモを入れてください。
            </p>
            <button
              type="button"
              onClick={() => {
                installDemoReactions();
                refresh();
              }}
              className="mt-4 rounded-md bg-viscum-berry px-4 py-2 text-sm font-medium text-white"
            >
              表示デモを入れる
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/w/${encodeURIComponent(r.workId)}`}
                  className="block rounded-lg border border-viscum-line bg-white/60 px-3 py-3 transition-colors hover:border-viscum-brand hover:bg-viscum-leaf-soft/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.kind === "suki"
                          ? "bg-viscum-berry/15 text-viscum-berry-deep"
                          : "bg-viscum-leaf-soft text-viscum-brand"
                      }`}
                    >
                      {r.kind === "suki" ? "スキ" : "気になる"}
                    </span>
                    <time
                      className="text-[11px] tabular-nums text-viscum-muted"
                      dateTime={r.createdAt}
                    >
                      {formatReactionStamp(r.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1.5 text-[14px] font-medium leading-snug text-viscum-ink line-clamp-2">
                    {r.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="pb-8 text-center text-sm">
          <Link href="/me" className="text-viscum-brand underline">
            マイシード（成績）へ
          </Link>
        </p>
      </main>
    </div>
  );
}
