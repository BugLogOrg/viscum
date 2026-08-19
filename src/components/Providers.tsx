"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { OnboardingGate } from "@/components/OnboardingGate";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <OnboardingGate>{children}</OnboardingGate>
    </SessionProvider>
  );
}
