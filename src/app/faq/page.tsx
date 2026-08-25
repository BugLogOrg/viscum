import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ViscumMark } from "@/components/ViscumMark";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "よくある質問 | VISCUM",
  description:
    "なぜこういう場が要るか、棚と直依頼のちがい、プロフィール公開範囲、手数料約10%、他サービスやサクラとの違い。",
};

const FAQS: { id?: string; q: string; body: ReactNode }[] = [
  {
    q: "VISCUMって何のサイト？",
    body: (
      <>
        <p>
          個人が作ったもの（まずアプリ／ツール、のち動画・小説など）を棚に並べて、
          <span className="font-medium">最初の反応</span>
          を集める場所です。日本語候補は「ヤドリギ」。作品を出す人を
          <span className="font-medium">シーダー</span>
          、見て書いてくれる人を
          <span className="font-medium">メンター</span>
          と呼びます。
        </p>
        <p>
          入場（見る・眺める）は無料。少額のコンペ＝小さな広告、という読みです。
        </p>
      </>
    ),
  },
  {
    q: "なぜこういう場が要るの？",
    body: (
      <>
        <p>
          作ることのハードルが下がるほど（AIで誰でも出せるようになるほど特に）、足りなくなるのは「つくる力」ではなく
          <span className="font-medium">最初の反応を、誠実に集める回路</span>
          です。誰でも出せるのに、見た人・書いた人がいない——その空白が、これからの痛みになります。
        </p>
        <p>いまの選択肢は、だいたい次に寄りがちです。</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>知人にタダで見てもらう（気後れ・好意の借金）</li>
          <li>
            クラウドソーシング等で労働・納品を買う（欲しいのは「反応」なのに、別物を買う）
          </li>
          <li>サクラや星の水増しで、見せ場だけ整える</li>
        </ul>
        <p>
          VISCUMはそのあいだに置く
          <span className="font-medium">第三の道</span>
          です。個人が作ったあと、少額でも「見てもらう・書いてもらう」にお金と手続きを乗せられる正規の出口。入場は無料で、払うのは出した側の任意。書く側にお金が回るのは、シーダーが採用・褒賞したあとです。
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium">小さな広告費の正規化</span>
            … バナー枠や影響力のレンタルではなく、反応そのものに値段が乗る
          </li>
          <li>
            <span className="font-medium">投げ銭の受け手シフト</span>
            … 配信者へではなく、反応をくれた人へ
          </li>
          <li>
            <span className="font-medium">信用はスコアではなく支払いの事実</span>
            … 「ちゃんと払う人か」が履歴として見える
          </li>
          <li>
            <span className="font-medium">サクラではない反応の募り方</span>
            … 人数保証・星の売買ではなく、稀少褒賞と作者の選択
          </li>
        </ul>
        <p>
          本丸は「メンターが稼ぐ副業アプリ」ではありません。皆が作れるようになる時代だからこそ、
          <span className="font-medium">
            気後れせず反応を集め、誠実に払える浜
          </span>
          が要る、という読みです。
        </p>
      </>
    ),
  },
  {
    q: "誰が払うの？見るだけでもお金かかる？",
    body: (
      <>
        <p>
          <span className="font-medium">
            払うのは、原則シーダー（出した人・コンペ主催者）だけ
          </span>
          です。
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>見る・読む・気になる → 無料</li>
          <li>無料コメント歓迎だけ置く → お金は動かない</li>
          <li>
            VISCUM内コンペ（初見レビュー ¥5,000／改善提案 ¥10,000）や公開ブースト（¥30,000）
            → シーダーが褒賞の財布を出す
          </li>
          <li>直依頼 → 指名した相手への有償オファー</li>
        </ul>
        <p>
          VISCUMは「メンターが稼ぐ副業アプリ」が本丸ではありません。個人が小さな広告費を落とせる出口です。書く側にお金が回るのは、シーダーが採用・褒賞したあと。
          <span className="font-medium">
            払った履歴（支払い完了の事実）が本丸
          </span>
          ——信用スコアではなく、ちゃんと払った記録が積み上がります。
        </p>
      </>
    ),
  },
  {
    q: "手数料はいくつ？Stripeの分は別？",
    body: (
      <>
        <p>
          有料で完了払いするときのシーダー負担は、
          <span className="font-medium">褒賞（メンター向け額面）の約10%上乗せ・決済込み</span>
          です。例: 褒賞¥5,000なら、支払い目安は約¥5,500。メンターに見える額面からは引きません。無料（¥0）のときは上乗せもありません。
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium">対外の基準は「約10%」だけ</span>
            … カード決済会社（Stripeなど）の実費と、場の通行料を分けて見せません。覚えやすさ優先です。
          </li>
          <li>
            <span className="font-medium">Stripeの事情は運営が飲む</span>
            … 実際のカード料は案件やカード種別で少し上下します。そのブレは運営側で吸収し、ユーザー向けの「約10%」を動かさない想定です。
          </li>
          <li>
            <span className="font-medium">払うタイミング</span>
            … 送った瞬間ではなく、シーダーが完了承認して支払うときです。
          </li>
        </ul>
        <p>
          「決済3.6%＋場の％」のような内訳表は出しません。関係者に必要なのは、メンターへの額面と、自分が払う総額だけです。
        </p>
      </>
    ),
  },
  {
    q: "書いてくれる人はどこから来るの？",
    body: (
      <>
        <p>
          運営が一斉に「評価者リスト」を配るモデルではありません。主は次です。
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <span className="font-medium">作者が自分で拡声器</span>
            … 共有文・URLを SNS／Discord／友人に貼る
          </li>
          <li>
            <span className="font-medium">VISCUM内の開催中を覗く人</span>
            … 入場無料なので、「いま何が熱いか」を見に来る層
          </li>
          <li>
            <span className="font-medium">直依頼</span>
            … この人の反応が欲しいとき、有償で声をかけられる
          </li>
          <li>
            <span className="font-medium">相互の循環（後から厚くなる）</span>
            … 書いた人が自分もシードする、フォローで開催が届く
          </li>
        </ol>
        <p>
          初期は薄いのが本音です。コンペ主催者であるシーダーが人を集めるほど盛り上がる——運営が人を配るより、作者の拡声が祭りを大きくする、という形です。
        </p>
      </>
    ),
  },
  {
    q: "素人コメントばかりにならない？力量は？",
    body: (
      <>
        <p>
          <span className="font-medium">力量を運営が保証しません。</span>
          代わりに次で濾します。
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>読んで選ぶのはシーダー本人（採用・褒賞は全員払いではない）</li>
          <li>足場の質問はあるが、範囲外の指摘も書いてよい</li>
          <li>ただ悪く言うだけは、採用も褒賞も生まれにくい</li>
          <li>
            公開ブーストは「やらせ・星の売買」を約束しない。正直な反応の募集
          </li>
        </ul>
        <p>
          ミソは
          <span className="font-medium">コンペであること</span>
          です。全員払いだと薄い量産になりやすい。稀少褒賞＋作者が選ぶ、で張り合いと予算の両方を守ります。「プロだけが書ける審査会」ではなく、軽い評価が取れる場が先です。本気の反応が欲しいときは金額と直依頼で寄せます。
        </p>
      </>
    ),
  },
  {
    q: "サクラややらせレビューと何が違うの？",
    body: (
      <>
        <p>
          いわゆるサクラは、
          <span className="font-medium">評価の見た目（星・好意的レビューの件数）を買う</span>
          ことです。VISCUMが売っているのは
          <span className="font-medium">作品への反応・言葉</span>
          で、人数保証や星の指定、やらせは約束しません。
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium">褒賞は稀少</span>
            … 書いた人全員に払うモデルではありません。薄い褒め量産になりにくい設計です。
          </li>
          <li>
            <span className="font-medium">選ぶのはシーダー</span>
            … 刺さった指摘・正直な反応を採れる。褒めだけが勝つ保証はありません。
          </li>
          <li>
            <span className="font-medium">公開ブースト</span>
            … 実利用したうえでの正直な反応を募る。星の売買・やらせは不可。必要な開示があれば付ける想定です。
          </li>
          <li>
            <span className="font-medium">支払いの事実が残る</span>
            … 「買った褒めを隠す」ための仕組みではなく、誰が何に払ったかが履歴として見えます。
          </li>
        </ul>
        <p>
          だから似て見えるのは「お金が動く」ところまで。目的が、見せ場の水増しではなく、初速の反応を集めることです。
        </p>
      </>
    ),
  },
  {
    q: "聞きたいことと違うことばかり書かれたら？",
    body: (
      <>
        <p>ズレは起きます。設計上の答えは次です。</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>シーダーは「見てほしいところ」を入口として書く</li>
          <li>メンターは足場に沿っても、気づいた追加でもよい</li>
          <li>どれを採るかはシーダーが選ぶ（採用・褒賞）</li>
          <li>
            終わったあともコメントは書けるが、締切後は賞金対象外と明示するつもりです
          </li>
        </ul>
        <p>
          「ほしい答えだけ強制」すると萎縮するのでやりません。ズレた声も、次のシードの材料になります。
        </p>
      </>
    ),
  },
  {
    q: "直依頼って、届いてから払うまでどうなるの？",
    body: (
      <>
        <p>
          ざっくり
          <span className="font-medium">届く → 返す → 払う</span>
          の3段です。途中で止まっても、勝手に引き落とされることはありません。
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <span className="font-medium">届く</span>
            … シーダーがあなたに直依頼を送る（または共有URLで着地）。褒賞の金額と作品・お願いが見えます。支払実績は確認用です。
          </li>
          <li>
            <span className="font-medium">返す</span>
            … ログインして返事を書く。内容は依頼主の
            <span className="font-medium">ご依頼DM</span>
            に届きます（作品の公開コメント欄には残りません）。やる／いまは無理、も同じスレで返せます。
          </li>
          <li>
            <span className="font-medium">払う</span>
            … シーダーが内容を見て、採用・褒賞するときだけ決済します。メンター側が先に課金される流れではありません。
          </li>
        </ol>
        <p>
          「返事した＝すぐ入金」ではありません。入るのは、シーダーが払ったあとです。不安なら、依頼主の支払実績（件数・累計）を先に見て判断して大丈夫です。希望日は目安で、過ぎてもすぐ失効する設計ではありません。提出→依頼主の完了承認で支払待ちになります。
        </p>
        <p>
          <span className="font-medium">いまは無理・未返信のまま</span>
          でも、プロフィールに傷やペナルティは付きません。公開の看板は支払い完了の件数と合計だけです。一方的に届いた依頼を無視してよい、という意味でもあります（受け取りを止めたいときは受付OFFを後段で足す想定です）。
        </p>
      </>
    ),
  },
  {
    id: "shelf-vs-request",
    q: "棚コンペと直依頼のちがいは？人を集めるときは？",
    body: (
      <>
        <p>
          混ぜません。入り口もIDも別です。
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium">棚（VISCUM内コンペ／公開ブースト）</span>
            … 広く集める祭り。コメントと採用は公開が燃料です。
          </li>
          <li>
            <span className="font-medium">直依頼</span>
            … この人の反応が欲しいときの指名オファー。中身は棚に出ません。
          </li>
        </ul>
        <p>
          <span className="font-medium">直依頼でコンペにする</span>
          のは向きません（指名の器に祭りを載せない）。
          <span className="font-medium">コンペの参加者を増やしたい</span>
          ときは直依頼ボタンではなく、
          <span className="font-medium">告知文・URLのコピー</span>
          を自分のSNSや友人に貼るのが本線です。「勝手に参加を呼びかけて」は、場が一斉DMするのではなく、シーダー自身の拡声です。
        </p>
      </>
    ),
  },
  {
    id: "profile-public",
    q: "プロフィールには何が公開されるの？非公開コンペは？",
    body: (
      <>
        <p>
          シーダー実績の公開は
          <span className="font-medium">支払い完了の件数と累計金額</span>
          までです。直依頼の本文・相手一覧・やりとりはプロフィールに出しません（案件の当事者だけが見ます）。
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium">コンペで選ばれたコメント</span>
            … 既定で公開します。書く側の実績にもなります。
          </li>
          <li>
            <span className="font-medium">非公開コンペや「高額だけ秘匿」</span>
            … 置きません。企業案件っぽくなり、払った事実が外から検証できなくなるためです。
          </li>
          <li>
            <span className="font-medium">中身を秘匿したい相談</span>
            … 非公開コンペではなく、直依頼レーンを使います。
          </li>
        </ul>
        <p>
          スコアや順位はありません。完了した支払いと採用の事実だけが看板です。
        </p>
      </>
    ),
  },
  {
    q: "クラウドソーシングやコンサル外注と何が違うの？",
    body: (
      <>
        <p>
          いちばん大きい違いは、
          <span className="font-medium">買っているものが違う</span>
          ことです。クラウドソーシングや業務委託は、だいたい
          <span className="font-medium">特定の人の労働時間・納品</span>
          を買います。VISCUMの本丸は
          <span className="font-medium">作品への反応・言葉</span>
          （小さな広告費の出口）です。バナー枠を売る広告屋でも、ワーカーを抱える外注サイトでもありません。
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium">VISCUM内コンペ／公開ブースト</span>
            … 広く募って、シーダーが選ぶ稀少褒賞。全員に払う外注ではありません。書けば必ずもらえるわけではないので、メンター側は「ただ働きになりうる」一方、シーダーは少額で複数の反応を集められます。これは意図した非対称です。
          </li>
          <li>
            <span className="font-medium">直依頼</span>
            … 指名の有償オファー。額面が見え、提出→完了承認のあとに払う流れで、外注の「この人に頼む」に近いレーンです。違いは、依頼主の
            <span className="font-medium">支払い完了の実績</span>
            が見えること、未登録の相手にもリンクで渡せることです。
          </li>
          <li>
            <span className="font-medium">信用の見せ方</span>
            … 星や総合ランキングではなく、支払いが完了した件数・累計などの事実です。「この人はちゃんと払うか」が気になる人向けです。
          </li>
        </ul>
        <p>
          しっかり1人と長期のコンサル契約をしたいだけなら、クラウドソーシングや直接契約の方が合うこともあります。VISCUMが向いているのは、「作品の初速の反応が欲しい」「払う実績が見える場で有償のお願いをしたい」ときです。
        </p>
      </>
    ),
  },
  {
    q: "Stripeの登録はいつ必要？口座とか面倒では？",
    body: (
      <>
        <p>
          <span className="font-medium">見る・返事を書くだけなら Stripe 登録は不要</span>
          です。ログイン（英語ID）があればコメント／ご依頼DMに参加できます。
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium">シーダー（払う側）</span>
            … 褒賞を払うタイミングで Stripe Checkout（カード決済）が必要になります。VISCUM上で「採用して支払う」などを押したときです。
          </li>
          <li>
            <span className="font-medium">メンター（受け取る側）</span>
            … 実際に褒賞を受け取る段階で、出金用の Stripe（Connect 等）登録が必要になる想定です。コメントしただけでは口座登録を求めません。
          </li>
        </ul>
        <p>
          シーダーが払う総額の目安は「褒賞の約10%・決済込み」です（上の「手数料はいくつ？」）。カード会社への実費のブレは運営が吸収する想定で、ユーザー向けにStripe料率の内訳表は出しません。いまはデモ段階のため、決済画面まで進んでも本番送金が完了しない・仮データが混ざる場合があります。本番接続後も、「払うとき／受け取るとき」に初めて Stripe の画面が出る、という切り方を維持します。
        </p>
      </>
    ),
  },
  {
    q: "ビジネスとして成立するの？",
    body: (
      <p>
        仮説は「個人の小さな広告費の正規化」です。バナー枠を売る広告屋ではなく、レビュー／反応のブーストに金が落ちる形。成立は実証前——だからデモと共有で検証中です。
      </p>
    ),
  },
  {
    q: "いま使って大丈夫？決済は？",
    body: (
      <>
        <p>
          デモ段階です。見た目・導線の確認が主で、データは消えることがあります。「仮データ混じり」と思って触ってください。
        </p>
        <p>
          決済は Stripe を使う想定ですが、本番の引き落とし・振込が常に動いているとは限りません。流れの説明は上の「届いてから払うまで」「Stripeの登録」を見てください。
        </p>
      </>
    ),
  },
];

/** よくある質問。友人レビュー起点の論点を別ページに。 */
export default function FaqPage() {
  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <header className="border-b border-viscum-line bg-viscum-paper-2/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <Link
            href="/lp"
            className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[0.12em] text-viscum-brand"
          >
            <ViscumMark className="h-8 w-8" />
            VISCUM
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            <Link href="/lp" className="text-viscum-muted hover:text-viscum-brand">
              LP
            </Link>
            <Link href="/" className="text-viscum-muted hover:text-viscum-brand">
              棚を見る
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-14">
        <p className="text-[12px] font-medium tracking-wide text-viscum-muted">
          FAQ
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-viscum-ink sm:text-[1.75rem]">
          よくある質問
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-viscum-muted">
          なぜこういう場が要るか、棚と直依頼のちがい、プロフィールに何が出るか、手数料、他サービスとの違い——最初に聞かれやすいところです。
        </p>

        <div className="mt-10 space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              id={item.id}
              className="group scroll-mt-24 rounded-lg border border-viscum-line bg-white/50 open:bg-white/80"
            >
              <summary className="cursor-pointer list-none px-4 py-3.5 text-[15px] font-medium text-viscum-ink marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  <span>{item.q}</span>
                  <span
                    className="mt-0.5 shrink-0 text-viscum-muted transition group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <div className="space-y-3 border-t border-viscum-line px-4 py-4 text-[14px] leading-relaxed text-viscum-ink">
                {item.body}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/lp"
            className="inline-flex rounded-md border border-viscum-brand px-5 py-2.5 text-sm font-medium text-viscum-brand transition hover:bg-viscum-leaf-soft"
          >
            LPに戻る
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-md bg-viscum-berry px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-viscum-berry-deep"
          >
            いま出ているものを見る
          </Link>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
