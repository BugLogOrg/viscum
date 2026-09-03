"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  onboardingHandleHref,
  onboardingWelcomeHref,
  rememberPostLoginDestination,
} from "@/lib/post-login-destination";

/** 英語ID未設定でも通してよいパス（設定画面本体・認証・API・説明ページ） */
const HANDLE_EXEMPT_PREFIX = [
  "/onboarding/handle",
  "/login",
  "/api",
  "/lp",
  "/faq",
  "/terms",
  "/privacy",
];

/** ウェルカム（専門タグ）未了でも通してよい公開面 */
const ONBOARDING_PUBLIC_PREFIX = [
  "/login",
  "/onboarding",
  "/api",
  "/lp",
  "/faq",
  "/terms",
  "/privacy",
  "/u",
  "/w",
];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isHandleExempt(pathname: string) {
  return matchesPrefix(pathname, HANDLE_EXEMPT_PREFIX);
}

function isOnboardingPublic(pathname: string) {
  if (pathname === "/") return true;
  return matchesPrefix(pathname, ONBOARDING_PUBLIC_PREFIX);
}

/**
 * 英語ID未設定 → 必ず handle（フィード含む。ログイン後の最初の画面）。
 * 初回ウェルカム未了 → welcome（公開棚は止めない）。
 * 招待着地／ご依頼DMにいた場合は戻り先を覚えてから飛ばす。
 */
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

    // 深いページにいるなら戻り先を残す（ゲートで飛ばす前に）
    if (
      pathname.startsWith("/dm/i/") ||
      pathname.startsWith("/dashboard/messages")
    ) {
      const q =
        typeof window !== "undefined"
          ? window.location.search.replace(/^\?/, "")
          : "";
      rememberPostLoginDestination(q ? `${pathname}?${q}` : pathname);
    }

    if (data?.user?.needsHandle && !isHandleExempt(pathname)) {
      const q =
        typeof window !== "undefined"
          ? window.location.search.replace(/^\?/, "")
          : "";
      const here = q ? `${pathname}?${q}` : pathname;
      router.replace(onboardingHandleHref(here));
      return;
    }
    if (
      data?.user &&
      !data.user.needsHandle &&
      data.user.needsOnboarding &&
      !isOnboardingPublic(pathname)
    ) {
      router.replace(onboardingWelcomeHref());
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

  if (data?.user?.needsHandle && !isHandleExempt(pathname)) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center bg-viscum-paper px-4 text-sm text-viscum-muted">
        ようこそ…英語IDの設定へ
      </div>
    );
  }
  if (
    data?.user &&
    !data.user.needsHandle &&
    data.user.needsOnboarding &&
    !isOnboardingPublic(pathname)
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
