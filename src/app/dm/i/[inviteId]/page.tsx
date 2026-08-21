import { DmInviteFromNeon } from "./DmInviteFromNeon";

type Props = {
  params: Promise<{ inviteId: string }>;
};

/** Neon に残した招待スナップショット着地（別端末でも開ける） */
export default async function DmInviteByIdPage({ params }: Props) {
  const { inviteId } = await params;
  return <DmInviteFromNeon inviteId={inviteId} />;
}
