import type { Metadata } from "next";
import Link from "next/link";
import { ViscumMark } from "@/components/ViscumMark";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "はじめに",
  description:
    "作ったものを誰かに見てほしい人と、誰かの作品を見てみたい人の入口。",
};

/** 「はじめに」。広告の着地は各LPへ直接。ここは立場が決まっていない人の分岐 */
export default function StartPage() {
  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <main className="mx-auto max-w-3xl px-6 py-14 sm:px-10 sm:py-20">
        <p className="flex items-center gap-3 text-base font-semibold tracking-[0.18em] text-viscum-brand">
          <ViscumMark className="h-10 w-10" />
          VISCUM
        </p>
        <h1 className="mt-6 text-2xl font-semibold leading-snug sm:text-[1.9rem]">
          どちらから、はじめますか？
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-viscum-muted">
          同じ人が、出す側にも見る側にもなれます。いまの気分に近い方からどうぞ。
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/lp/seeder"
            className="group rounded-xl border border-viscum-line bg-white/70 px-5 py-6 transition hover:border-viscum-brand hover:bg-white"
          >
            <p className="text-[17px] font-semibold text-viscum-ink">
              作ったものを、誰かに見てほしい
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
              アプリや動画、文章を出して、最初の反応を募ります。
            </p>
            <p className="mt-4 text-[13px] font-medium text-viscum-brand group-hover:underline">
              作ったものを出す人へ
            </p>
          </Link>
          <Link
            href="/lp/mentor"
            className="group rounded-xl border border-viscum-line bg-white/70 px-5 py-6 transition hover:border-viscum-brand hover:bg-white"
          >
            <p className="text-[17px] font-semibold text-viscum-ink">
              誰かの作品を、見てみたい
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
              出したばかりの作品を開いて、気が向いたら一言を残します。
            </p>
            <p className="mt-4 text-[13px] font-medium text-viscum-brand group-hover:underline">
              見て、書く人へ
            </p>
          </Link>
        </div>

        <p className="mt-10 text-[13px]">
          <Link href="/" className="text-viscum-brand underline">
            まずは登録なしで眺める
          </Link>
        </p>

        <SiteFooter />
      </main>
    </div>
  );
}
