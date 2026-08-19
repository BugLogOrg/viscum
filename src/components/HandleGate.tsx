"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const ALLOW = ["/login", "/onboarding/handle", "/api"];

/** Magic Link 初回で英語ID未設定ならオンボーディングへ */
export function HandleGate({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    const needs = Boolean(data?.user?.needsHandle);
    const exempt = ALLOW.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (needs && !exempt) {
      router.replace("/onboarding/handle");
      return;
    }
    setReady(true);
  }, [status, data?.user?.needsHandle, pathname, router]);

  if (status === "loading") return children;
  if (data?.user?.needsHandle && !ALLOW.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center bg-viscum-paper px-4 text-sm text-viscum-muted">
        英語IDの設定へ…
      </div>
    );
  }
  if (!ready && data?.user?.needsHandle) return null;
  return <>{children}</>;
}
