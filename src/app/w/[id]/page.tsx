import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { getWork } from "@/data/dummy-works";
import { workPageMetadata } from "@/lib/work-og";
import { WorkDetailGate } from "./WorkDetailGate";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return workPageMetadata(getWork(id) ?? null, id);
}

export default async function WorkDetailPage({ params }: Props) {
  const { id } = await params;
  const initialWork = getWork(id) ?? null;

  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd />
      <WorkDetailGate workId={id} initialWork={initialWork} />
    </BrowseChrome>
  );
}
