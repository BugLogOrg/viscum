import Link from "next/link";
import { ViscumMark } from "@/components/ViscumMark";
import { SiteFooter } from "@/components/SiteFooter";

/** LP。シーダー向けの説明と、メンターへの呼びかけを分けて書く */
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
            場内でフィードバックを集める。必要なら、外の公開場所でも正直な反応を試す。見るだけの人はお金を払わずに眺めて大丈夫。お金が動くのは、つくった側が「ちゃんと聞きたい／外でも試したい」と思ったときだけです。
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
            どんな場所なの？
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            つくったあとって、「誰かに見てもらいたい」のに、投稿しても流れていく感じ、ありませんか。SNSに載せても既読スルーだったり、友人に頼むのは気後れしたり。あの、ちょっと寂しい感じをなんとかしたくて、気後れせずに「見てください」と言える場所にしたいと思っています。見るだけの人は、お金を払わずに、いま何が盛り上がっているのかを眺めていられます。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            いまは、誰でもつくれる時代です。コンテンツは溢れかえっている。つくることは大事だけど、それだけでは終わらない。どう守って、どう育てていくか。ブーストのかけ方が、大事になると思っています。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            推しにスパチャする感覚でいい。ただし落とす先は、有名人じゃなく、あなたの作品。VISCUMは、そのための場所です。
          </p>
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
            VISCUM（ヴィスカム）は、個人でつくったものを置いておける、小さな掲示板みたいなサービスです。日本語の呼び名は「ヤドリギ」を考えています。鳥が実をくわえて運んで、種を落としていく——つくった人が種を撒いて、反応をもらって、また次をつくる。そんなふうに回っていくといいな、と思っています。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            作品を出す人を
            <span className="font-medium" title="種を撒く人">
              シーダー
            </span>
            （種を撒く人）、見て書いてくれる人をメンターと呼びます。名前は雰囲気だけなので、「出す側」と「書いてくれる側」だと思ってください。どちらから入っても大丈夫です。
          </p>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            シーダーができること
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            シーダーは、作品を出して「ここを見てほしい」と書けます。反応がほしいときのコースは、次の4つです（同じ投稿では重ねません）。
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-viscum-ink">
            <li>
              <span className="font-medium">無料コメント</span>
              … コメント歓迎だけ。お金は使いません。
            </li>
            <li>
              <span className="font-medium">初見レビュー ¥5,000</span>
              … VISCUM内で、初めて見た人に「どう見えたか」を聞く。褒賞は採用や上位に寄せます。
            </li>
            <li>
              <span className="font-medium">改善提案 ¥10,000</span>
              … VISCUM内で、どこを直せば伝わるかを聞く。褒賞は採用や上位に寄せます。
            </li>
            <li>
              <span className="font-medium">公開ブースト ¥30,000</span>
              … 外の公開場所へ正直な反応・投稿を募る。記入後に報告してもらい、誰に褒賞を上げるか選びます。依頼して書かせる管理型ではありません。
            </li>
            <li>
              <span className="font-medium">直依頼する</span>
              … 「あなたに書いてほしい」と、その人だけに声をかける。上のコースとは別ものです（シードしたあとにできます）。
            </li>
          </ul>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            価格はいつも ¥0／¥5,000／¥10,000／¥30,000 だけです。候補が集まるかどうかは、URLを広げられるかにもよります。足場の質問を用意したら、あとはメンターに書いてもらう番です。
          </p>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            メンターのみなさんへ
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            メンターは、専門家のための役ではありません。同じようにものをつくっている人、ちょっと詳しい人、素直な第一印象をくれる人。そのくらいの幅で大丈夫です。書いてくれる人を、歓迎しています。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            書いてみるときの目安は、こんな感じです。
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-viscum-ink">
            <li>
              シーダーが聞いていることは入口です。短くても具体的に返してもらえると助かります。
            </li>
            <li>
              足場の質問はそのままでも大丈夫です。気づいたことがあれば、追加でアレンジしても構いません。もしかしたらそちらの方が、いちばん参考になることもあります。
            </li>
            <li>
              点をつけたり順位を決めたりはしません。「ここは伝わった」「ここで迷った」で十分です。
            </li>
            <li>
              読んで選ぶのはシーダー本人です。厳しい指摘は歓迎ですが、ただ悪く言うだけのコメントは、採用も褒賞も生まれにくいです。
            </li>
            <li>
              公開ブーストに参加するときは、外に書いたあと投稿URLなどを報告してください。褒賞は全員ではなく、シーダーが選びます。
            </li>
            <li>
              直依頼が来たら、やる／いまは無理、だけ返してもらえれば大丈夫です。断ってもまったく問題ありません。
            </li>
          </ul>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            こちらから営業して回る必要はありません。「募集に応えて書く」「頼まれたら書く」側で大丈夫です。コメントするだけなら口座の登録もいりません。まずは、いま出ているものから書いてみてください。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            書いたあとに返ってくるのは、お礼や、採用された記録、ときどき褒賞です。しっくりきたら登録してみてください。登録すると、褒賞を受け取れるようになったり、自分でも作品を出してお願いできるようになります。
          </p>
        </section>

        <section className="mt-14 rounded-xl border border-viscum-line bg-viscum-paper-2/60 px-5 py-6">
          <h2 className="text-[15px] font-semibold text-viscum-ink">
            「ちゃんと払う人？」について
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-viscum-muted">
            お金の話が出てくると、「この人、ちゃんと払ってくれるのかな」は気になりますよね。かといって、点数や星で人を並べたくはありません。なので、ポートフォリオには「支払いが終わった件数」と「これまでの合計金額」という事実だけを出します。スコアではないので、上げるためにがんばるようなものでもありません。
          </p>
          <p className="mt-3 text-[13px] text-viscum-muted">
            画面の見本（デモ）:
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            <Link
              href="/dm/promo-15s?to=%E5%A4%AA%E9%83%8E"
              className="text-[13px] font-medium text-viscum-brand underline"
            >
              外部の人へのお願いページ
            </Link>
            <Link
              href="/w/promo-15s"
              className="text-[13px] font-medium text-viscum-brand underline"
            >
              公開コンペの作品ページ
            </Link>
            <Link
              href="/w/promo-15s/request"
              className="text-[13px] font-medium text-viscum-brand underline"
            >
              サイト内の人への直依頼
            </Link>
            <Link
              href="/u/ayu"
              className="text-[13px] font-medium text-viscum-brand underline"
            >
              支払い実績の例
            </Link>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            お金のやり取りについて
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            VISCUMは、いまは個人でつくっているサービスです。褒賞のやり取りには、
            Stripe（ストライプ）という外部の決済サービスを使います。買い物サイトなどの裏側に入っていることが多い仕組みで、カード決済や振込先の管理を専門にやってくれます。VISCUMは「誰が誰に、いくら払ったか」を記録してつなぐだけで、カード番号や口座番号そのものはStripe側が持ちます。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            払うときは、カード情報はStripeの画面に入力します。その番号がVISCUMのサーバーに残ることはありません。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            受け取る側も、登録したらすぐ振り込まれる、という形ではありません。まずシーダーが採用や褒賞を決めて、そのあとで受け取りの手続きに進みます。そこで本人確認と振込先（ふつうは銀行口座）をStripeに登録します。口座番号もVISCUMは持たず、Stripeから入金される形です。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            コメントを書くだけなら、口座の登録もStripeの手続きもいりません。もらう段になってからで大丈夫です。
          </p>
        </section>

        <section className="mt-14 border-t border-viscum-line pt-10">
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            誰でも作れる時代だからこそ、育て方が問われる。つくったものをちゃんと見てもらって、「ここが良かった」と言ってもらう。それが嬉しい。そして、その一言にちゃんとお金が乗ることも、うれしいことです。褒賞はおまけではありません。反応に値段をつけること自体が、この場所の大事な一部です。
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-viscum-ink">
            お金は嫌うものじゃありません。払うことも、貰うこともできます。コメントひとつで、誰かの次の一手の助けになれるかもしれません。気持ちよく回していきましょう。
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-viscum-ink">
            シードして、眺めて、書いて、ときに払う、ときに貰う。出しても、書いても、VISCUMを楽しんでもらえたら嬉しいです。
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
