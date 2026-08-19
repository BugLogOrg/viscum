"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { HandleGate } from "@/components/HandleGate";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <HandleGate>{children}</HandleGate>
    </SessionProvider>
  );
}
