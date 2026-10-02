import Link from "next/link";
import type { ReactNode } from "react";
import { ViscumMark } from "@/components/ViscumMark";

/** LPのカード画像。ページで openGraph を書くとルートの opengraph-image は継がれないため明示する */
export const LP_SHARE_IMAGE = {
  url: "/lp-worldview.jpg",
  width: 1400,
  height: 933,
  alt: "木に寄生する丸いヤドリギの房と、実を運ぶ鳥のイラスト",
};

/** LP共通の緑ヒーロー。見出しと本文は立場ごとに渡す */
export function LpHero({
  title,
  children,
  ctaHref = "/",
  ctaLabel = "登録なしで見てみる",
}: {
  title: ReactNode;
  children: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <header className="relative overflow-hidden border-b border-viscum-line">
      <div
        className="absolute inset-0 bg-gradient-to-br from-viscum-leaf-deep via-viscum-leaf to-viscum-moss opacity-90"
        aria-hidden
      />
      <div
        className="absolute -right-16 -top-10 h-56 w-56 rounded-full bg-viscum-berry/25 blur-2xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-6 pb-12 pt-12 sm:px-10 sm:pb-16 sm:pt-16">
        <p className="flex items-center gap-3 text-base font-semibold tracking-[0.18em] text-white/95 sm:text-lg">
          <ViscumMark className="h-11 w-11 sm:h-12 sm:w-12" />
          VISCUM
        </p>
        <h1 className="mt-5 max-w-xl text-3xl font-semibold leading-snug text-white sm:text-[2.35rem]">
          {title}
        </h1>
        <div className="mt-5 max-w-lg space-y-3 text-[15px] leading-relaxed text-white/92">
          {children}
        </div>
        <div className="mt-8">
          <Link
            href={ctaHref}
            className="inline-flex rounded-md bg-viscum-berry px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-viscum-berry-deep"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

/** 世界観の木＋名前の由来。立場ごとの一言は children で足す */
export function LpNameStory({ children }: { children?: ReactNode }) {
  return (
    <section className="mt-14 space-y-4">
      <figure className="overflow-hidden rounded-xl border border-viscum-line bg-viscum-paper-2/60 shadow-sm">
        <img
          src="/lp-worldview.jpg"
          alt="木に寄生する丸いヤドリギの房と、実を運ぶ鳥のイラスト"
          className="h-auto w-full"
          width={1400}
          height={933}
        />
        <figcaption className="border-t border-viscum-line px-4 py-3 text-[13px] leading-relaxed text-viscum-muted">
          一本の木に、いくつもの丸いヤドリギ——それぞれの種が、それぞれの世界を育てる。鳥が実を運び、反応が寄り添う。
        </figcaption>
      </figure>
      <h2 className="text-lg font-semibold text-viscum-brand">
        VISCUMという名前について
      </h2>
      <p className="text-[15px] leading-relaxed text-viscum-ink">
        VISCUM（ヴィスカム）は日本語に訳すと「ヤドリギ」です。鳥が実を運び、種を落とす——つくった人が種を撒いて、反応をもらって、また次をつくる。シーダーは「種を撒く人」。メンターは教える人ではなく、隣で見て、思ったことを書く人、という意味で使っています。
      </p>
      {children}
    </section>
  );
}

/** 支払いの事実・お金の扱い・FAQ。シーダー／メンターどちらのLPにも置く */
export function LpTrustAndMoney({
  audience,
}: {
  audience: "seeder" | "mentor";
}) {
  const isSeeder = audience === "seeder";
  return (
    <>
      <section className="mt-14 rounded-xl border border-viscum-line bg-viscum-paper-2/60 px-5 py-6">
        <h2 className="text-[15px] font-semibold text-viscum-ink">
          {isSeeder
            ? "あなたの支払いも、事実として残ります"
            : "「ちゃんと払う人？」について"}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
          {isSeeder
            ? "書く人にとって、「ちゃんと払ってくれる相手か」は気になるところです。点数や星で人を並べず、あなたのプロフィールには「支払いが終わった件数」と「これまでの合計金額」という事実だけが出ます。スコアではありません。"
            : "お金の話が出ると、「ちゃんと払ってくれるのかな」は気になりますよね。点数や星で人を並べず、作品を出した人のプロフィールには「支払いが終わった件数」と「これまでの合計金額」という事実だけを出します。スコアではありません。"}
        </p>
        <p className="mt-3 text-[13px]">
          <Link
            href="/u/ayu"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-viscum-brand underline"
          >
            表示の見本（デモの人物・実際の取引ではありません）
          </Link>
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-viscum-brand">
          お金のやり取りについて
        </h2>
        <p className="text-[15px] leading-relaxed text-viscum-ink">
          決済はStripeを利用します。カード情報や振込先をVISCUMが保持することはありません。コメントにはログインが必要ですが、口座登録は褒賞を受け取るときだけで大丈夫です。
        </p>
        {isSeeder ? (
          <p className="text-[13px] leading-relaxed text-viscum-muted">
            有料のお願いは、いま準備を進めているところです。実際のお金のやり取りは、まだ始まっていません。
          </p>
        ) : null}
        <p className="text-[13px] leading-relaxed">
          <Link
            href="/faq#fees"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-viscum-brand underline"
          >
            手数料はいくつ？
          </Link>
          <span className="text-viscum-muted"> ／ </span>
          <Link
            href="/faq#stripe"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-viscum-brand underline"
          >
            Stripeの登録はいつ必要？
          </Link>
          <span className="text-viscum-muted"> ／ </span>
          <Link
            href="/faq#prize-flow"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-viscum-brand underline"
          >
            褒賞の入金と受け取り
          </Link>
          <span className="text-viscum-muted">（FAQ）</span>
        </p>
      </section>

      <section className="mt-14 space-y-4">
        <h2 className="text-lg font-semibold text-viscum-brand">
          よくある質問
        </h2>
        <p className="text-[15px] leading-relaxed text-viscum-ink">
          誰が払うのか、書いてくれる人はどこから来るのか、直依頼の流れなど——細かいことはFAQにまとめました。
        </p>
        <Link
          href="/faq"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md border border-viscum-brand px-5 py-2.5 text-sm font-medium text-viscum-brand transition hover:bg-viscum-leaf-soft"
        >
          FAQを読む
        </Link>
      </section>
    </>
  );
}

/** もう一方の立場のLPへ渡す一文 */
export function LpAudienceSwitch({ to }: { to: "seeder" | "mentor" }) {
  const toMentor = to === "mentor";
  return (
    <section className="mt-14 rounded-xl border border-viscum-line bg-white/60 px-5 py-5">
      <p className="text-[14px] leading-relaxed text-viscum-ink">
        {toMentor
          ? "誰かの作品を見て、一言を残す側にもなれます。"
          : "自分の作ったものを出して、反応を頼む側にもなれます。"}
      </p>
      <p className="mt-2 text-[13px]">
        <Link
          href={toMentor ? "/lp/mentor" : "/lp/seeder"}
          className="font-medium text-viscum-brand underline"
        >
          {toMentor ? "見て、書く人へ" : "作ったものを出す人へ"}
        </Link>
      </p>
    </section>
  );
}
