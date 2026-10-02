import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import {
  LP_SHARE_IMAGE,
  LpAudienceSwitch,
  LpHero,
  LpNameStory,
  LpTrustAndMoney,
} from "@/components/LpCommon";

const MENTOR_DESCRIPTION =
  "個人が出したばかりの作品を、見る側として開ける場所。見るだけ無料。作品を出した人が言葉を選んだときに、褒賞が渡る仕組みです。";

export const metadata: Metadata = {
  title: "見て、書く人へ",
  description: MENTOR_DESCRIPTION,
  openGraph: {
    title: "VISCUM ｜ 見て、書く人へ",
    description: MENTOR_DESCRIPTION,
    url: "/lp/mentor",
    images: [LP_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "VISCUM ｜ 見て、書く人へ",
    description: MENTOR_DESCRIPTION,
    images: [LP_SHARE_IMAGE],
  },
};

/** メンター向けLP。金額の表は置かず、褒賞は条件とセットで書く */
export default function MentorLandingPage() {
  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <LpHero
        title={
          <>
            誰かが出したばかりの作品を、
            <br />
            見る側として開く場所。
          </>
        }
      >
        <p>
          アプリ、短い動画、小説の冒頭。個人が「見てほしい」と置いた作品が並んでいます。
        </p>
        <p>見るだけなら無料です。気が向いたら、一言を残せます。</p>
      </LpHero>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:px-10">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            どんな場所なの？
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            家のことがひと段落して、少しだけ時間ができる。スマホを開くと、流れてくるのはできあがったものばかり。見ているぶんには楽しいけれど、自分はいつも見る側のまま、という夜もあります。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            VISCUMに並んでいるのは、その少し手前の作品です。出したばかりで、まだ誰の言葉も付いていない。そこに最初の一言を置けるのが、見る人の席です。
          </p>
        </section>

        <LpNameStory>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            見て書く人は、絵のなかの鳥です。実をくわえて、次の枝まで運ぶ。推す先は有名人ではなく、名前も知らない誰かが、今夜出した作品です。
          </p>
        </LpNameStory>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            専門家でなくて、大丈夫
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            評論は頼みません。点も、順位も付けません。
          </p>
          <ul className="space-y-1.5 border-l-2 border-viscum-leaf-soft pl-4 text-[15px] leading-relaxed text-viscum-ink">
            <li>「ここは、すぐ分かった」</li>
            <li>「このボタンのところで、少し迷った」</li>
            <li>「音を消して見ても、何の話か伝わった」</li>
          </ul>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            そのくらいの一言で足ります。厳しい内容でも、短くても構いません。出した人が知りたいのは、次をどう直すかです。ほめるために書く場所でも、頼まれた通りの感想を書く場所でもありません。
          </p>
          <p className="text-[13px]">
            <Link
              href="/faq#writing"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-viscum-brand underline"
            >
              書くときの目安は？（FAQ）
            </Link>
          </p>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            選ばれた言葉には、褒賞が渡る仕組みです
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            作品によっては、出した人が「この言葉がほしかった」と思った人へ、褒賞をつけています。いくらのお願いかは、作品ごとに書いてあります（初めて見た印象なら5,000円、など）。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-viscum-ink">
            <li>選ぶのは、作品を出した人です。書いた人全員に渡るわけではありません</li>
            <li>褒賞のない作品では、お金は動きません</li>
            <li>選ばれたら、書かれた額面がそのまま渡る仕組みです。手数料は出した人の側です</li>
            <li>口座の登録は、褒賞を受け取るときまで要りません</li>
            <li>名前を指定してお願いが届いても、受けるか断るかは自分で決められます</li>
          </ul>
          <p className="text-[13px] leading-relaxed text-viscum-muted">
            有料のお願いは、いま準備を進めているところです。実際の褒賞の受け渡しは、まだ始まっていません。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            作品によっては、自分のSNSやストアに感想を残すお願いもあります。そのときは、頼まれて書いたことが分かる表示を隠しません。自分から書いた感想のふりはしません。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            プロフィールには、参加した作品、選ばれた回数、受け取った回数と金額が、事実として残ります。点数や順位ではありません。
          </p>
        </section>

        <LpTrustAndMoney audience="mentor" />

        <LpAudienceSwitch to="seeder" />

        <section className="mt-14 border-t border-viscum-line pt-10">
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            その日は、開いて、眺めて、閉じるだけでも構いません。書きたくなったときに、一言を置いてもらえたら嬉しいです。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex rounded-md bg-viscum-berry px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-viscum-berry-deep"
            >
              いま出ている作品を見る
            </Link>
            <a
              href="https://x.com/viscumorg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md border border-viscum-brand px-5 py-2.5 text-sm font-medium text-viscum-brand transition hover:bg-viscum-leaf-soft"
            >
              公式Xで新しいお願いを知る
            </a>
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
