import Link from "next/link";
import { auth } from "@/auth";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { MessagesLocalCleanup } from "@/components/MessagesLocalCleanup";
import {
  formatRequestAmountLabel,
  formatRequestDmStamp,
  formatYen,
  statusLabel,
} from "@/lib/local-request-dms";
import { listMyRequestDms } from "@/lib/list-my-request-dms";
import { listMyDmInvites } from "@/lib/list-my-dm-invites";
import { displayRequestWorkTitle } from "@/lib/local-seeds";

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

  const [{ requests, persisted }, { invites }] = await Promise.all([
    listMyRequestDms(userId),
    listMyDmInvites(userId),
  ]);
  const me = handle.toLowerCase();
  const mine = requests
    .filter(
      (r) =>
        r.fromHandle.toLowerCase() === me ||
        (r.toHandle && r.toHandle.toLowerCase() === me),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = mine.filter(
    (r) =>
      r.status === "pending" &&
      r.toHandle &&
      r.toHandle.toLowerCase() === me,
  );
  const inviteById = new Map(invites.map((i) => [i.id, i]));
  /** スレに invite が紐づいている外発行は、招待一覧を重複表示しない */
  const orphanInvites = invites.filter(
    (inv) => !mine.some((r) => r.inviteId === inv.id),
  );
  return (
    <BrowseChrome>
      <MessagesLocalCleanup />
      <SiteHeader backHref="/dashboard" hideOnMd hidePostCta />
      <main className="max-w-lg space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-viscum-ink">ご依頼DM</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
            直依頼ごとの薄いやりとりです。全ユーザーの受信箱ではありません。
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

        {orphanInvites.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-[13px] font-semibold text-viscum-ink">
              外に出したリンク（旧・スレ未紐づけ）
            </h2>
            <p className="text-[11px] leading-relaxed text-viscum-muted">
              新しい発行は「やりとり」に返事待ちスレとして先に出ます。ここは過去の招待の残りです。
            </p>
            <ul className="divide-y divide-viscum-line rounded-lg border border-viscum-line bg-white/50">
              {orphanInvites.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      href={inv.path}
                      className="block px-3 py-3 transition hover:bg-viscum-leaf-soft/30"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[14px] font-medium text-viscum-ink">
                          {displayRequestWorkTitle(inv.workId, inv.workTitle)}
                        </p>
                        <span className="shrink-0 text-[11px] font-medium text-viscum-berry-deep">
                          返事待ち
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-viscum-muted">
                        外リンク · {formatRequestAmountLabel(inv.amountYen)}
                      </p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-viscum-muted">
                        <time dateTime={inv.createdAt}>
                          発行 {formatRequestDmStamp(inv.createdAt)}
                        </time>
                      </p>
                    </Link>
                  </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold text-viscum-ink">やりとり</h2>
          <ul className="divide-y divide-viscum-line rounded-lg border border-viscum-line bg-white/50">
            {mine.map((r) => {
              const outbound = Boolean(r.outboundUnassigned);
              const incoming =
                !outbound &&
                r.toHandle.toLowerCase() === handle.toLowerCase();
              const peer = outbound
                ? ""
                : incoming
                  ? r.fromHandle
                  : r.toHandle;
              const peerName = outbound
                ? "外リンク（返事待ち）"
                : incoming
                  ? r.fromAccountName || r.fromHandle
                  : r.toHandle;
              const invitePath = r.inviteId
                ? inviteById.get(r.inviteId)?.path ?? `/dm/i/${r.inviteId}`
                : null;
              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/messages/${encodeURIComponent(r.id)}`}
                    className="block px-3 py-3 transition hover:bg-viscum-leaf-soft/30"
                  >
                    <div className="flex gap-3">
                      {r.workThumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.workThumbUrl}
                          alt=""
                          className="h-12 w-[4.6rem] shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-[4.6rem] shrink-0 items-center justify-center rounded bg-viscum-paper-2 text-[10px] text-viscum-muted">
                          無
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[14px] font-medium text-viscum-ink">
                            {peerName}
                            {peer ? (
                              <span className="font-normal text-viscum-muted">
                                {" "}
                                (@{peer})
                              </span>
                            ) : null}
                          </p>
                          <span
                            className={`shrink-0 text-[11px] ${
                              outbound || r.status === "pending"
                                ? "font-medium text-viscum-berry-deep"
                                : "text-viscum-muted"
                            }`}
                          >
                            {outbound ? "返事待ち" : statusLabel(r.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-viscum-muted">
                          {outbound
                            ? "外リンク"
                            : incoming
                              ? "受信"
                              : "送信"}{" "}
                          · {formatYen(r.amountYen)} ·{" "}
                          {displayRequestWorkTitle(r.workId, r.workTitle)}
                          {invitePath ? " · 招待あり" : ""}
                        </p>
                        <p className="mt-0.5 text-[11px] tabular-nums text-viscum-muted">
                          <time dateTime={r.createdAt}>
                            {outbound
                              ? "発行"
                              : incoming
                                ? "届いた"
                                : "送った"}{" "}
                            {formatRequestDmStamp(r.createdAt)}
                          </time>
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
            {mine.length === 0 && (
              <li className="px-3 py-8 text-center text-[13px] text-viscum-muted">
                {orphanInvites.length > 0
                  ? "新しい発行はここに返事待ちスレとして出ます。"
                  : "まだご依頼DMはありません"}
              </li>
            )}
          </ul>
        </section>
      </main>
    </BrowseChrome>
  );
}
