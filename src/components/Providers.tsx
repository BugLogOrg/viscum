"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { OnboardingGate } from "@/components/OnboardingGate";

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <OnboardingGate>{children}</OnboardingGate>
    </SessionProvider>
  );
}
