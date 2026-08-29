import { BrowseChrome } from "@/components/BrowseChrome";
import { SiteHeader } from "@/components/SiteHeader";

/** 通知 SSR 待ちの間もシェルを先に出す */
export default function NotificationsLoading() {
  return (
    <BrowseChrome>
      <SiteHeader backHref="/" hideOnMd hidePostCta />
      <div className="max-w-lg space-y-5 px-4 py-6">
        <div className="h-7 w-24 animate-pulse rounded bg-viscum-line/60" />
        <div className="h-4 w-full max-w-sm animate-pulse rounded bg-viscum-line/40" />
        <div className="space-y-0 overflow-hidden rounded-lg border border-viscum-line">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="border-b border-viscum-line px-3 py-3 last:border-b-0"
            >
              <div className="h-4 w-40 animate-pulse rounded bg-viscum-line/50" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-viscum-line/30" />
            </div>
          ))}
        </div>
      </div>
    </BrowseChrome>
  );
}
