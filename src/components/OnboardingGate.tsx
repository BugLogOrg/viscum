"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const ALLOW_PREFIX = ["/login", "/onboarding", "/api", "/lp"];

function isAllowed(pathname: string) {
  return ALLOW_PREFIX.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** 英語ID未設定 → handle。初回ウェルカム未了 → welcome。2回目以降は出さない */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    const allowed = isAllowed(pathname);

    if (data?.user?.needsHandle && !allowed) {
      router.replace("/onboarding/handle");
      return;
    }
    if (
      data?.user &&
      !data.user.needsHandle &&
      data.user.needsOnboarding &&
      !allowed
    ) {
      router.replace("/onboarding/welcome");
      return;
    }
    setReady(true);
  }, [
    status,
    data?.user?.needsHandle,
    data?.user?.needsOnboarding,
    data?.user,
    pathname,
    router,
  ]);

  if (status === "loading") return children;

  if (data?.user?.needsHandle && !isAllowed(pathname)) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center bg-viscum-paper px-4 text-sm text-viscum-muted">
        英語IDの設定へ…
      </div>
    );
  }
  if (
    data?.user &&
    !data.user.needsHandle &&
    data.user.needsOnboarding &&
    !isAllowed(pathname)
  ) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center bg-viscum-paper px-4 text-sm text-viscum-muted">
        はじめの設定へ…
      </div>
    );
  }

  if (
    !ready &&
    data?.user &&
    (data.user.needsHandle || data.user.needsOnboarding)
  ) {
    return null;
  }

  return <>{children}</>;
}
