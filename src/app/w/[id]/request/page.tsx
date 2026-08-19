import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getWork } from "@/data/dummy-works";
import { DirectRequestForm } from "./DirectRequestForm";

type Props = { params: Promise<{ id: string }> };

export default async function DirectRequestPage({ params }: Props) {
  const { id } = await params;
  const work = getWork(id);
  if (!work) notFound();

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-viscum-paper">
      <SiteHeader backHref={`/w/${work.id}`} />
      <main className="px-4 py-6">
        <p className="text-xs text-viscum-muted">S06 · 直依頼デモ</p>
        <h1 className="mt-1 text-xl font-semibold text-viscum-ink">
          メンターに頼む
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-viscum-muted">
          上段は外部DM用URL（未登録者向け・宣伝兼）。下段はサイト内のメンター指名。
        </p>
        <div className="mt-6">
          <DirectRequestForm work={work} />
        </div>
        <p className="mt-8 text-center text-sm">
          <Link
            href={`/w/${work.id}`}
            className="text-viscum-brand hover:underline"
          >
            作品に戻る
          </Link>
        </p>
      </main>
    </div>
  );
}
