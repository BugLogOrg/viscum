import { getWork } from "@/data/dummy-works";
import { DmInviteClient } from "./DmInviteClient";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ to?: string }>;
};

/**
 * 外部DM用の着地。VISCUM未登録者向け。
 * 内部の `/w/[id]/request`（指名フォーム）とは別。
 */
export default async function DmInvitePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { to: toRaw } = await searchParams;
  const initialWork = getWork(id) ?? null;
  const to = toRaw?.trim() ? decodeURIComponent(toRaw.trim()) : null;

  return (
    <DmInviteClient workId={id} initialWork={initialWork} to={to} />
  );
}
