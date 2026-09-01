import { Suspense } from "react";
import { DmInviteFromNeon } from "./DmInviteFromNeon";

type Props = {
  params: Promise<{ inviteId: string }>;
};

/** Neon に残した招待スナップショット着地（別端末でも開ける） */
export default async function DmInviteByIdPage({ params }: Props) {
  const { inviteId } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-viscum-paper px-4 py-10 text-sm text-viscum-muted">
          読み込み中…
        </div>
      }
    >
      <DmInviteFromNeon inviteId={inviteId} />
    </Suspense>
  );
}
