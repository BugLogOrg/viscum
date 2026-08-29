import { auth } from "@/auth";
import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { hasDatabase } from "@/db";
import { listNotificationsForUser } from "@/db/notifications";
import { NotificationsClient } from "./NotificationsClient";
import type { RemoteNotify } from "@/lib/remote-notifies";

export default async function NotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const loggedIn = Boolean(userId && !userId.startsWith("demo:"));

  let initialRows: RemoteNotify[] = [];
  if (loggedIn && userId && hasDatabase()) {
    const rows = await listNotificationsForUser(userId);
    initialRows = rows.map((n) => ({
      ...n,
      audience: n.audience,
    }));
  }

  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd hidePostCta />
      <NotificationsClient initialRows={initialRows} loggedIn={loggedIn} />
    </BrowseChrome>
  );
}
