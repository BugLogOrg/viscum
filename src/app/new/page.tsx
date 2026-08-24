import Link from "next/link";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";

/** ADR-038: 棚シードと直依頼は入り口で分ける */
export default function SeedIntentPage() {
  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-6 px-4 py-8">
        <div>
          <p className="text-xs text-viscum-muted">シードする</p>
          <h1 className="mt-1 text-xl font-semibold text-viscum-ink">
            今日はどうする？
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-viscum-muted">
            棚に出して広く集めるのと、指名して頼むのは別物です（別ID）。あとから同じものを兼用しません。
          </p>
        </div>

        <ul className="space-y-3">
          <li>
            <Link
              href="/new/shelf"
              className="block rounded-lg border-2 border-viscum-berry/40 bg-viscum-berry/5 px-4 py-4 transition hover:border-viscum-berry hover:bg-viscum-berry/10"
            >
              <p className="text-[15px] font-semibold text-viscum-berry-deep">
                広く集める（棚に出す）
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-viscum-ink">
                無料コメント／VISCUM内コンペ／公開ブースト。作品一覧に載せて反応を募ります。公開ブーストは公式X紹介つき（リーチ非保証）。
              </p>
              <p className="mt-2 text-[12px] font-medium text-viscum-brand">
                棚レーンへ →
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/new/request"
              className="block rounded-lg border-2 border-viscum-brand/35 bg-white/80 px-4 py-4 transition hover:border-viscum-brand hover:bg-viscum-leaf-soft/40"
            >
              <p className="text-[15px] font-semibold text-viscum-leaf-deep">
                指名して頼む（直依頼）
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-viscum-ink">
                特定の人への有償オファー。棚には出ません。売りは支払い実績が見える取引の器です（公式Xブーストは付きません）。
              </p>
              <p className="mt-2 text-[12px] font-medium text-viscum-brand">
                直依頼レーンへ →
              </p>
            </Link>
          </li>
        </ul>

        <p className="text-center text-[12px] text-viscum-muted">
          <Link href="/faq" className="underline hover:text-viscum-brand">
            直依頼と公開ブーストのちがい（FAQ）
          </Link>
        </p>
      </main>
    </BrowseChrome>
  );
}
