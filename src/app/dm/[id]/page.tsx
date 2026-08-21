import { getWork } from "@/data/dummy-works";
import { DmInviteClient } from "./DmInviteClient";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * 外部DM用の着地。VISCUM未登録者向け。
 * 内部の `/w/[id]/request`（指名フォーム）とは別。
 * URLを知っている人は誰でも開ける（共有リンク。鍵ではない）。
 */
export default async function DmInvitePage({ params }: Props) {
  const { id } = await params;
  const initialWork = getWork(id) ?? null;

  return <DmInviteClient workId={id} initialWork={initialWork} />;
}
