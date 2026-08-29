import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { getWork } from "@/data/dummy-works";
import { getNeonWorkForRequest } from "@/lib/neon-works";
import { workPageMetadata } from "@/lib/work-og";
import { WorkDetailGate } from "./WorkDetailGate";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const work = getWork(id) ?? (await getNeonWorkForRequest(id));
  // 下書きは作者以外 null → noindex 相当の見つからないメタ
  if (work && work.persisted && work.listedOnShelf === false) {
    return workPageMetadata(work, id);
  }
  return workPageMetadata(work ?? null, id);
}

export default async function WorkDetailPage({ params }: Props) {
  const { id } = await params;
  const initialWork =
    getWork(id) ?? (await getNeonWorkForRequest(id)) ?? null;

  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd />
      <WorkDetailGate workId={id} initialWork={initialWork} />
    </BrowseChrome>
  );
}
