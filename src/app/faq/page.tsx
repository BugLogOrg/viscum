import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ViscumMark } from "@/components/ViscumMark";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "よくある質問 | VISCUM",
  description:
    "誰が払うのか、書いてくれる人はどこから来るのか、力量やフィードバックのズレについて。",
};

const FAQS: { q: string; body: ReactNode }[] = [
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
          <li>見る・読む・スキ／気になる → 無料</li>
          <li>無料コメント歓迎だけ置く → お金は動かない</li>
          <li>
            場内コンペ（初見レビュー ¥5,000／改善提案 ¥10,000）や公開ブースト（¥30,000）
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
            <span className="font-medium">場内の開催中を覗く人</span>
            … 入場無料なので、「いま何が熱いか」を見に来る層
          </li>
          <li>
            <span className="font-medium">直依頼</span>
            … この人の目が欲しいとき、有償で声をかけられる
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
          です。全員払いだと薄い量産になりやすい。稀少褒賞＋作者が選ぶ、で張り合いと予算の両方を守ります。「プロだけが書ける審査会」ではなく、軽い評価が取れる場が先です。本気の目が欲しいときは金額と直依頼で寄せます。
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
      <p>
        デモ段階です。見た目・導線の確認が主で、データは消えることがあります。本番の決済・ドメインは段階的です。「仮データ混じり」と一言あると安心です。
      </p>
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
          お金の絡み方、書いてくれる人の集まり方、力量、フィードバックのズレ——最初に聞かれやすいところです。
        </p>

        <div className="mt-10 space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border border-viscum-line bg-white/50 open:bg-white/80"
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
