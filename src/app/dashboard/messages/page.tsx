import Link from "next/link";
import { auth } from "@/auth";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { MessagesLocalCleanup } from "@/components/MessagesLocalCleanup";
import { MessagesInbox } from "@/components/MessagesInbox";
import { listMyRequestDms } from "@/lib/list-my-request-dms";

export default async function MessagesIndexPage() {
  const session = await auth();
  const handle = session?.user?.handle?.replace(/^@/, "").trim();
  const userId = session?.user?.id;

  if (!session?.user || !handle || !userId) {
    return (
      <BrowseChrome>
        <SiteHeader backHref="/" hideOnMd hidePostCta />
        <main className="max-w-lg px-4 py-10">
          <h1 className="text-xl font-semibold text-viscum-ink">ご依頼DM</h1>
          <p className="mt-2 text-[14px] text-viscum-muted">
            ログインが必要です。
          </p>
          <Link
            href="/login?callbackUrl=/dashboard/messages"
            className="mt-6 inline-flex rounded-md bg-viscum-berry px-4 py-2.5 text-sm font-medium text-white"
          >
            ログインへ
          </Link>
        </main>
      </BrowseChrome>
    );
  }

  const { requests, persisted } = await listMyRequestDms(userId);
  const me = handle.toLowerCase();
  const mine = requests.filter(
    (r) =>
      r.fromHandle.toLowerCase() === me ||
      (r.toHandle && r.toHandle.toLowerCase() === me),
  );
  const pending = mine.filter(
    (r) =>
      r.status === "pending" &&
      r.toHandle &&
      r.toHandle.toLowerCase() === me,
  );
  const invitePaths = Object.fromEntries(
    mine
      .filter((r) => Boolean(r.inviteId?.trim()))
      .map((r) => [r.inviteId!.trim(), `/dm/i/${r.inviteId!.trim()}`] as const),
  );

  return (
    <BrowseChrome>
      <MessagesLocalCleanup />
      <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">ご依頼DM</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
            直依頼ごとのやりとりと進捗です。ステータスは各スレに出ます（ダッシュボードには重ねません）。
            {persisted
              ? " サーバーに保存され、相手アカウントにも届きます。"
              : " （サーバー未接続時は端末のみ）"}
          </p>
        </div>

        {pending.length > 0 && (
          <p className="rounded-md border border-viscum-berry/30 bg-viscum-berry/5 px-3 py-2 text-[13px] text-viscum-ink">
            未返信のご依頼が {pending.length} 件あります
          </p>
        )}

        <MessagesInbox
          handle={handle}
          requests={mine}
          invitePaths={invitePaths}
          emptyHint="まだご依頼DMはありません"
        />
      </main>
    </BrowseChrome>
  );
}
