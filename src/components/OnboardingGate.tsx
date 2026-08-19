"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

/** ログイン不要／オンボ中でも見てよい公開面 */
const PUBLIC_PREFIX = [
  "/login",
  "/onboarding",
  "/api",
  "/lp",
  "/u",
  "/w",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIX.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** 英語ID未設定 → handle。初回ウェルカム未了 → welcome。公開棚は止めない */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 未ログイン／読み込み中は絶対にオンボへ送らない（ログアウト直後のちらつき対策）
    if (status !== "authenticated") {
      setReady(true);
      return;
    }

    const pub = isPublicPath(pathname);
    if (data?.user?.needsHandle && !pub) {
      router.replace("/onboarding/handle");
      return;
    }
    if (
      data?.user &&
      !data.user.needsHandle &&
      data.user.needsOnboarding &&
      !pub
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

  if (status !== "authenticated") {
    return <>{children}</>;
  }

  const pub = isPublicPath(pathname);

  if (data?.user?.needsHandle && !pub) {
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
    !pub
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
