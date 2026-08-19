import { Suspense } from "react";
import { FeedClient } from "@/components/FeedClient";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-dvh max-w-7xl bg-viscum-paper px-4 py-8 text-sm text-viscum-muted">
          読み込み中…
        </div>
      }
    >
      <FeedClient />
    </Suspense>
  );
}
