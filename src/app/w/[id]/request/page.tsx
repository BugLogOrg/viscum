import Link from "next/link";
import { notFound } from "next/navigation";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { getWork } from "@/data/dummy-works";
import { DirectRequestForm } from "./DirectRequestForm";

type Props = { params: Promise<{ id: string }> };

export default async function DirectRequestPage({ params }: Props) {
  const { id } = await params;
  const work = getWork(id);
  if (!work) notFound();

  return (
    <BrowseChrome>
      <SiteHeader backHref={`/w/${work.id}`} hideOnMd />
      <main className="max-w-lg px-4 py-6">
        <p className="text-xs text-viscum-muted">直依頼</p>
        <h1 className="mt-1 text-xl font-semibold text-viscum-ink">
          この人に頼む
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-viscum-muted">
          公開コンペとは別の、個人宛てのお願いです。候補は検索できます（フォロー不要）。
        </p>
        <div className="mt-6">
          <DirectRequestForm work={work} />
        </div>
        <p className="mt-8 text-center text-sm text-viscum-muted">
          <Link
            href={`/w/${work.id}`}
            className="text-viscum-brand hover:underline"
          >
            ← この作品のページへ戻る
          </Link>
        </p>
      </main>
    </BrowseChrome>
  );
}
