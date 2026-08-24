import Link from "next/link";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { getWork } from "@/data/dummy-works";
import { DirectRequestGate } from "./DirectRequestGate";

type Props = { params: Promise<{ id: string }> };

export default async function DirectRequestPage({ params }: Props) {
  const { id } = await params;
  const initialWork = getWork(id) ?? null;

  return (
    <BrowseChrome>
      <SiteHeader
        backHref={initialWork ? `/w/${initialWork.id}` : "/"}
        hideOnMd
      />
      <main className="max-w-lg px-4 py-6">
        <p className="text-xs text-viscum-muted">直依頼</p>
        <h1 className="mt-1 text-xl font-semibold text-viscum-ink">
          この人に頼む
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-viscum-muted">
          直依頼は<strong>非公開</strong>の指名オファーです（棚には出ません）。公開コンペのあとに特定の人へ届ける本線は、告知文のコピーです。
        </p>
        <div className="mt-6">
          <DirectRequestGate workId={id} initialWork={initialWork} />
        </div>
        <p className="mt-8 text-center text-sm text-viscum-muted">
          <Link
            href={initialWork ? `/w/${initialWork.id}` : "/"}
            className="text-viscum-brand hover:underline"
          >
            ← {initialWork ? "この作品のページへ戻る" : "ホームへ戻る"}
          </Link>
        </p>
      </main>
    </BrowseChrome>
  );
}
