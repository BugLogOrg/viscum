import Link from "next/link";
import { ViscumMark } from "@/components/ViscumMark";
import { SiteFooter } from "@/components/SiteFooter";

/** LP。30秒理解 → コース → 感情／信用。細則は FAQ へ */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
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
            作ったものを出して、
            <br />
            最初の反応を集める場所。
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/92">
            VISCUMの中で反応を集める。必要なら、ストアやSNSなど自分の公開場所でも正直な反応を試せる。見るだけならお金はかからない。お金が動くのは、つくった側が「ちゃんと聞きたい」と思ったときだけです。
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-md bg-viscum-berry px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-viscum-berry-deep"
            >
              登録なしで見てみる
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:px-10">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            何ができるの？
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            つくった作品を出して反応を集められます。訪れた人は見て、コメントできます。必要なら有料で反応を募ったり、特定の人に頼んだりもできます。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            作品を出す側を
            <span className="font-medium">シーダー</span>
            、見て書いてくれる側を
            <span className="font-medium">メンター</span>
            と呼びます。どちらから入っても大丈夫です。
          </p>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            シーダーができること
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            作品を出して「ここを見てほしい」と書けます。棚のコースは次の4つです（同じ投稿では重ねません）。
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-viscum-ink">
            <li>
              <span className="font-medium">無料コメント</span>
              … コメント歓迎だけ。お金は使いません。
            </li>
            <li>
              <span className="font-medium">初見レビュー ¥5,000</span>
              … VISCUM内で、初めて見た人に「どう見えたか」を聞く。
            </li>
            <li>
              <span className="font-medium">改善提案 ¥10,000</span>
              … VISCUM内で、どこを直せば伝わるかを聞く。
            </li>
            <li>
              <span className="font-medium">公開ブースト ¥30,000</span>
              … ストアやSNSなど、自分の公開場所へ正直な反応を募る。
            </li>
          </ul>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            <span className="font-medium">直依頼</span>
            は上の4つとは別ものです。「この人の反応が欲しい」ときの有償オファー（目安¥5,000〜¥50,000）。シードしたあとにできます。
          </p>
        </section>

        <section className="mt-14 space-y-3">
          <h2 className="text-lg font-semibold text-viscum-brand">
            見る人・書く人へ
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            見る人も、書く人も歓迎です。専門家でなくても、率直な第一印象だけで参加できます。コメントするだけなら口座登録は不要です。
          </p>
          <p className="text-[13px]">
            <Link
              href="/faq#writing"
              className="font-medium text-viscum-brand underline"
            >
              書くときの目安（FAQ）
            </Link>
          </p>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            どんな場所なの？
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            つくったあと、「誰かに見てもらいたい」のに投稿しても流れていく感じ、ありませんか。SNSでは既読スルーだったり、友人に頼むのは気後れしたり。あの少し寂しい感じをなんとかしたくて、気後れせずに「見てください」と言える場所にしたいと思っています。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            いまは誰でもつくれる時代です。つくることは大事だけど、それだけでは終わらない。どう守り、どう育てるか——ブーストのかけ方が大事になる、と思っています。
          </p>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            VISCUMという名前について
          </h2>
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
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            日本語の呼び名としては「ヤドリギ」を考えています。鳥が実を運び、種を落とす——つくった人が種を撒いて、反応をもらって、また次をつくる。シーダーは「種を撒く人」、メンターは寄り添って書いてくれる人、という由来です。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            推しにスパチャする感覚でいい。ただし落とす先は有名人ではなく、あなたの作品——反応そのものに値段が乗る、という考え方です。
          </p>
        </section>

        <section className="mt-14 rounded-xl border border-viscum-line bg-viscum-paper-2/60 px-5 py-6">
          <h2 className="text-[15px] font-semibold text-viscum-ink">
            「ちゃんと払う人？」について
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
            お金の話が出ると、「ちゃんと払ってくれるのかな」は気になりますよね。点数や星で人を並べず、プロフィールには「支払いが終わった件数」と「これまでの合計金額」という事実だけを出します。スコアではありません。
          </p>
          <p className="mt-3 text-[13px]">
            <Link
              href="/u/ayu"
              className="font-medium text-viscum-brand underline"
            >
              支払い実績の例
            </Link>
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-viscum-brand">
            お金のやり取りについて
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            決済はStripeを利用します。カード情報や振込先をVISCUMが保持することはありません。コメントするだけなら口座登録も不要です。
          </p>
          <p className="text-[13px]">
            <Link
              href="/faq#stripe"
              className="font-medium text-viscum-brand underline"
            >
              手数料・Stripeの詳細（FAQ）
            </Link>
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
            className="inline-flex rounded-md border border-viscum-brand px-5 py-2.5 text-sm font-medium text-viscum-brand transition hover:bg-viscum-leaf-soft"
          >
            FAQを読む
          </Link>
        </section>

        <section className="mt-14 border-t border-viscum-line pt-10">
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            シードして、眺めて、書いて、ときに払い、ときに受け取る。出しても書いても、VISCUMを楽しんでもらえたら嬉しいです。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex rounded-md bg-viscum-berry px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-viscum-berry-deep"
            >
              いま出ているものを見る
            </Link>
            <Link
              href="/new"
              className="inline-flex rounded-md border border-viscum-brand px-5 py-2.5 text-sm font-medium text-viscum-brand transition hover:bg-viscum-leaf-soft"
            >
              作品をシードしてみる
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
