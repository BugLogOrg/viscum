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
import {
  PLATFORM_FEE_RATE,
  formatYenJa,
  quoteSeederCharge,
} from "@/lib/seeder-pricing";

const SEEDER_DESCRIPTION =
  "作ったものを出して、最初の反応を募る場所。見るだけ無料。件数の保証はありません。お金が動くのは、つくった側が有料で反応を頼んだときです。";

export const metadata: Metadata = {
  title: "作ったものを出す人へ",
  description: SEEDER_DESCRIPTION,
  openGraph: {
    title: "VISCUM ｜ 作ったものを出す人へ",
    description: SEEDER_DESCRIPTION,
    url: "/lp/seeder",
    images: [LP_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "VISCUM ｜ 作ったものを出す人へ",
    description: SEEDER_DESCRIPTION,
    images: [LP_SHARE_IMAGE],
  },
};

const COURSES = [
  {
    name: "初見レビュー",
    prizeYen: 5000,
    body: "VISCUM内で、初めて見た人に「どう見えたか」を聞く。",
  },
  {
    name: "改善提案",
    prizeYen: 10000,
    body: "VISCUM内で、どこを直せば伝わるかを聞く。",
  },
  {
    name: "公開ブースト",
    prizeYen: 30000,
    body: "ストアやSNSなど、自分の公開場所へ正直な反応を募る。",
  },
] as const;

/** シーダー向けLP。30秒理解 → コース → 感情／信用。細則は FAQ へ */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <LpHero
        title={
          <>
            作ったものを出して、
            <br />
            最初の反応を集める場所。
          </>
        }
      >
        <p>
          VISCUMの中で反応を集める。必要なら、ストアやSNSなど自分の公開場所でも正直な反応を試せる。
        </p>
        <p>お金が動くのは、つくった側が有料で反応を頼んだときです。</p>
        <p className="text-[13px] text-white/80">
          反応の件数や内容は保証しません。
        </p>
      </LpHero>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:px-10">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            どんな場所なの？
          </h2>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            つくったあと、「誰かに見てもらいたい」のに投稿しても流れていく感じ、ありませんか。SNSでは既読スルーだったり、友人に頼むのは気後れしたり。あの少し寂しい感じをなんとかしたくて、気後れせずに「見てください」と言える場所にしたいと思っています。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            いまは誰でもつくれる時代です。つくることは大事だけど、それだけでは終わらない。出したあと、誰に見てもらい、何を聞くかが大事になる、と思っています。
          </p>
        </section>

        <LpNameStory>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            推しを応援する感覚でいい。ただし推す先は有名人ではなく、自分の作品——「ちゃんと聞きたい」からお金が動く、という考え方です。
          </p>
        </LpNameStory>

        <section className="mt-14 space-y-4">
          <h2 className="text-lg font-semibold text-viscum-brand">
            具体的に何ができるの？
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
          <figure className="overflow-hidden rounded-xl border border-viscum-line bg-viscum-paper-2/60 shadow-sm">
            <img
              src="/lp-concept.png"
              alt="VISCUMの循環。シーダー（ヤドリギ）が作品（実）を出し、メンター（鳥）が見て書いて繋がる。内側は反応・楽しむ・褒賞"
              className="h-auto w-full"
              width={1280}
              height={720}
            />
          </figure>
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
            {COURSES.map((c) => (
              <li key={c.name}>
                <span className="font-medium">
                  {c.name} 褒賞{formatYenJa(c.prizeYen)}
                </span>
                <span className="text-viscum-muted">
                  （お支払い 約{formatYenJa(quoteSeederCharge(c.prizeYen).totalYen)}）
                </span>
                … {c.body}
              </li>
            ))}
          </ul>
          <p className="text-[13px] leading-relaxed text-viscum-muted">
            お支払いは、褒賞の額面＋場の手数料{PLATFORM_FEE_RATE * 100}%＋決済手数料（実費）です。褒賞は選ばれた人へ額面のまま渡ります。
          </p>
          <p className="text-[13px] leading-relaxed text-viscum-muted">
            公開ブーストでは、書かれた感想に「依頼して書いてもらったもの」と分かる表示（PRなど）が付きます。お願いする側も、その表示を外さない前提でお願いしてください。
          </p>
          <p className="text-[15px] leading-relaxed text-viscum-ink">
            <span className="font-medium">直依頼</span>
            は上の4つとは別ものです。「この人の反応が欲しい」ときの有償オファー（目安¥5,000〜¥50,000）。シードしたあとにできます。
          </p>
        </section>

        <LpTrustAndMoney audience="seeder" />

        <LpAudienceSwitch to="mentor" />

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
