import type { Metadata } from "next";
import Link from "next/link";
import { PROTOCOL_COLORS } from "@/lib/protocol-colors";
import { ProtocolChipDemo } from "@/components/ProtocolChipRow";
import { SiteFooter } from "@/components/SiteFooter";
import { ViscumMark } from "@/components/ViscumMark";

export const metadata: Metadata = {
  title: "色見本（プロトコル）",
  description:
    "トンマナ（アース）と反応プロトコル（ビビッド）の並記見本。本番ナビには載せない仮ページ。",
  robots: { index: false, follow: false },
};

const EARTH = [
  { name: "葉 deep", varName: "--viscum-leaf-deep", swatch: "bg-viscum-leaf-deep" },
  { name: "モス", varName: "--viscum-moss", swatch: "bg-viscum-moss" },
  { name: "ベリー", varName: "--viscum-berry", swatch: "bg-viscum-berry" },
  { name: "幹", varName: "--viscum-trunk", swatch: "bg-viscum-trunk" },
  { name: "紙", varName: "--viscum-paper", swatch: "bg-viscum-paper border border-viscum-line" },
] as const;

export default function ProtocolLabPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <header className="flex h-12 items-center justify-between border-b border-viscum-line px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-[0.12em] text-viscum-brand"
        >
          <ViscumMark className="h-6 w-6" />
          VISCUM
        </Link>
        <span className="text-[11px] text-viscum-muted">lab · noindex</span>
      </header>

      <main className="space-y-8 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">
            色見本 — プロトコル
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-viscum-muted">
            場の空気はアース。反応の言語はビビッド。色だけで意味を伝えず、必ず語を併記（CUD）。
            黄だけ表札確定（気になる）。他は仮。コメント投稿にはまだ繋いでいません。
            フィード右下の4色は、🟡だけ既存の気になる件数。他は詳細コメントからの集計が流れる想定。
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
            1. タップ用チップ（並び見本）
          </h2>
          <ProtocolChipDemo />
        </section>

        <section className="space-y-3">
          <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
            2. プロトコル4色（ビビッド）
          </h2>
          <ul className="space-y-2">
            {PROTOCOL_COLORS.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-3 rounded-md border border-viscum-line bg-viscum-paper-2/80 px-3 py-2.5"
              >
                <span
                  className="mt-0.5 h-10 w-10 shrink-0 rounded-md border border-black/5 shadow-sm"
                  style={{ background: `var(${c.cssVar})` }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-viscum-ink">
                    <span aria-hidden className="mr-1">
                      {c.emoji}
                    </span>
                    {c.label}
                    <span className="ml-1.5 text-[11px] font-normal text-viscum-muted">
                      {c.labelStatus === "fixed" ? "確定" : "仮"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-viscum-muted">
                    {c.attitude}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-viscum-trunk">
                    {c.cssVar}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
            3. トンマナ（アース）— 混ぜない対照
          </h2>
          <div className="flex flex-wrap gap-2">
            {EARTH.map((e) => (
              <div key={e.name} className="w-[4.5rem] text-center">
                <div
                  className={`mx-auto h-10 w-10 rounded-md ${e.swatch}`}
                  aria-hidden
                />
                <p className="mt-1 text-[11px] text-viscum-ink">{e.name}</p>
                <p className="truncate font-mono text-[9px] text-viscum-muted">
                  {e.varName}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[13px] font-medium tracking-wide text-viscum-brand">
            4. 衝突チェック（離れているか）
          </h2>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-md border border-viscum-line p-2.5">
              <p className="text-viscum-muted">ブランド葉</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-8 w-8 rounded bg-viscum-leaf-deep" />
                <span className="h-8 w-8 rounded bg-viscum-protocol-green" />
              </div>
              <p className="mt-1.5 text-viscum-ink">葉 deep ↔ プロトコル緑</p>
            </div>
            <div className="rounded-md border border-viscum-line p-2.5">
              <p className="text-viscum-muted">CTAベリー</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-8 w-8 rounded bg-viscum-berry" />
                <span className="h-8 w-8 rounded bg-viscum-protocol-red" />
              </div>
              <p className="mt-1.5 text-viscum-ink">ベリー ↔ プロトコル赤</p>
            </div>
          </div>
          <p className="text-[12px] leading-relaxed text-viscum-muted">
            近い／遠いの感覚で変数をいじる。本番フィードにはまだ出しません。
          </p>
        </section>

        <p className="text-[12px] text-viscum-muted">
          <Link href="/" className="text-viscum-brand hover:underline">
            ← TOP
          </Link>
          {" · "}
          <Link href="/faq" className="text-viscum-brand hover:underline">
            FAQ
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
