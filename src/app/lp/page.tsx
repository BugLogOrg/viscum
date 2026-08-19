import Link from "next/link";
import { ViscumMark } from "@/components/ViscumMark";
import { SiteFooter } from "@/components/SiteFooter";
import { LpWorldviewArt } from "@/components/LpWorldviewArt";

/** シーダー主語のLP。柔らかく・正確に「どんなサービスか」を伝える */
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
            小さな広告費で、
            <br />
            最初の「反応」を頼める場所。
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/92">
            アプリや動画、小説など、個人でつくったものを並べておけます。見に来た人はお金を払わずに眺めて大丈夫。報酬が発生するのは、つくった側が「ちゃんと見てもらいたい」と思ったときだけ——コメントに報酬をつけて、短時間で第一印象を集めます。
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
          <figure className="overflow-hidden rounded-xl border border-viscum-line bg-viscum-paper-2/60 shadow-sm">
            <LpWorldviewArt />
            <figcaption className="border-t border-viscum-line px-4 py-3 text-[13px] leading-relaxed text-viscum-muted">
              鳥が実をくわえて運んで、種を落とす——つくった人が種を撒き、反応が寄り添い、また次が育つ。
            </figcaption>
          </figure>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            VISCUM（ヴィスカム）は、個人でつくったものを置いておける、小さな掲示板みたいなサービスです。日本語の呼び名は「ヤドリギ」を考えています。鳥が実をくわえて運んで、種を落としていく——つくった人が種を撒いて、反応をもらって、また次をつくる。そんなふうに回っていくといいな、と思っています。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            主役は、作品をシードする人です。VISCUMではその人を
            <span className="font-medium" title="種を撒く人">
              シーダー
            </span>
            （種を撒く人）と呼びます。コメントを書いてくれる人はメンターです。名前は雰囲気だけのものなので、要は「シードする側」と「見てくれる側」だと思ってください。
          </p>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            シーダーができること
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            シーダーは、作品を出して「ここを見てほしい」と書けます。反応がほしいときの頼み方は、4つあります。
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-viscum-ink">
            <li>
              <span className="font-medium">そのまま並べる</span>
              … コメント歓迎だけ。お金は使いません。
            </li>
            <li>
              <span className="font-medium">コメントコンペにする</span>
              … 少しだけチップを用意して、いろんな人に書いてもらう。宣伝費みたいな気持ちで出せます。やらなくても大丈夫。すべてに褒賞は付けず、採用や上位に寄せます。
            </li>
            <li>
              <span className="font-medium">直依頼する</span>
              … 「あなたに書いてほしい」と、その人だけに声をかける。公開のコンペとは別ものです。
            </li>
            <li>
              <span className="font-medium">公開ブーストを頼む</span>
              … App Store や Chrome 拡張、SNSなど、外の公開の場所へ正直な反応や投稿を残してもらうプランです。合格／不合格を検品して、合格した人には固定の謝礼を確実に払います（やらせや、触ってもいない星だけは不合格）。先に全額を預ける前払いにはしません。媒体に枠を買う「広告」とは少し違い、人が痕跡を残して押し上げるブーストです。場内のコンペとは別ものです。
            </li>
          </ul>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            場内でもらったコメントには、お礼を言ったり、採用したり、チップを渡したりできます。公開ブーストは合格／不合格を付けて、合格者へ払います。払うかどうかを決めるのはシーダーなので、書く側は条件を見て参加できます。
          </p>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            メンターは何をする人？
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            メンターは、専門家のための役ではありません。同じようにものをつくっている人、ちょっと詳しい人、素直な第一印象をくれる人。そのくらいの幅で大丈夫です。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            やってほしいのは、こんなことです。
          </p>
          <ul className="list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-viscum-ink">
            <li>
              シーダーが「ここを見てほしい」と書いたところが入口です。短くてもいいので、具体的に返してもらえると助かります。
            </li>
            <li>
              そこ以外の話を書いてもかまいません。むしろ、本人がまったく気づいていなかったことを言ってもらえると、いちばんありがたいときもあります。
            </li>
            <li>
              点をつけたり順位を決めたりはしません。「ここは伝わった」「ここで迷った」で十分です。
            </li>
            <li>
              読んで選ぶのはシーダー本人です。厳しい指摘は歓迎ですが、ただ悪く言うだけのコメントは、採用もチップも生まれません。
            </li>
            <li>
              直依頼が来たら、やる／いまは無理、だけ返してもらえれば大丈夫です（断ってもまったく問題ありません）。
            </li>
          </ul>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            書いた側に返ってくるのは、お礼や、採用された記録、ときどきチップです。こちらから営業して回るのではなく、「頼まれたら書く」側だと思ってください。コメントするだけなら口座の登録もいりません。まずは書いてみてください。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            しっくりきたら、登録してみてください。登録すると、チップを受け取れるようになったり、自分でも作品を出してお願いできるようになります。
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
            VISCUMは、いまは個人でつくっているサービスです。チップのやり取りには、
            Stripe（ストライプ）という外部の決済サービスを使います。買い物サイトなどの裏側に入っていることが多い仕組みで、カード決済や振込先の管理を専門にやってくれます。VISCUMは「誰が誰に、いくら払ったか」を記録してつなぐだけで、カード番号や口座番号そのものはStripe側が持ちます。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            チップを払うときは、カード情報はStripeの画面に入力します。その番号がVISCUMのサーバーに残ることはありません。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            受け取る側も、登録したらすぐ振り込まれる、という形ではありません。まずシーダーが採用やチップを決めて、そのあとで受け取りの手続きに進みます。そこで本人確認と振込先（ふつうは銀行口座）をStripeに登録します。口座番号もVISCUMは持たず、Stripeから入金される形です。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            コメントを書くだけなら、口座の登録もStripeの手続きもいりません。もらう段になってからで大丈夫です。
          </p>
        </section>

        <section className="mt-14 border-t border-viscum-line pt-10">
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            つくったものをちゃんと見てもらって、「ここが良かった」と言ってもらう。それが嬉しい。そして、その一言にちゃんとお金が乗ることも、うれしいことです。チップはおまけではありません。反応に値段をつけること自体が、この場所の大事な一部です。
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-viscum-ink">
            お金は嫌うものじゃありません。払うことも、貰うこともできます。コメントひとつで、誰かの次の一手の助けになれるかもしれません。気持ちよく回していきましょう。
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-viscum-ink">
            シードして、眺めて、書いて、ときに払う、ときに貰う。そんなふうにVISCUMを楽しんでもらえたら嬉しいです。
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-md bg-viscum-berry px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-viscum-berry-deep"
            >
              いま出ているものを見る
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
