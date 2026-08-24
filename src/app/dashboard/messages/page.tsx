import Link from "next/link";
import { auth } from "@/auth";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { MessagesLocalCleanup } from "@/components/MessagesLocalCleanup";
import {
  formatRequestDmStamp,
  formatYen,
  statusLabel,
} from "@/lib/local-request-dms";
import { listMyRequestDms } from "@/lib/list-my-request-dms";
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

  const { requests, persisted } = await listMyRequestDms(userId);
  const me = handle.toLowerCase();
  const mine = requests
    .filter(
      (r) =>
        r.toHandle.toLowerCase() === me || r.fromHandle.toLowerCase() === me,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = mine.filter(
    (r) => r.status === "pending" && r.toHandle.toLowerCase() === me,
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

        <ul className="divide-y divide-viscum-line rounded-lg border border-viscum-line bg-white/50">
          {mine.map((r) => {
            const incoming = r.toHandle.toLowerCase() === handle.toLowerCase();
            const peer = incoming ? r.fromHandle : r.toHandle;
            const peerName = incoming
              ? r.fromAccountName || r.fromHandle
              : r.toHandle;
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
                          <span className="font-normal text-viscum-muted">
                            {" "}
                            (@{peer})
                          </span>
                        </p>
                        <span
                          className={`shrink-0 text-[11px] ${
                            r.status === "pending"
                              ? "font-medium text-viscum-berry-deep"
                              : "text-viscum-muted"
                          }`}
                        >
                          {statusLabel(r.status)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-viscum-muted">
                        {incoming ? "受信" : "送信"} · {formatYen(r.amountYen)} ·{" "}
                        {displayRequestWorkTitle(r.workId, r.workTitle)}
                      </p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-viscum-muted">
                        <time dateTime={r.createdAt}>
                          {incoming ? "届いた" : "送った"}{" "}
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
              まだご依頼DMはありません
            </li>
          )}
        </ul>
      </main>
    </BrowseChrome>
  );
}
