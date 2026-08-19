"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { DUMMY_WORKS } from "@/data/dummy-works";

/** 作品詳細・/dashboard・投稿など。左カラム常時。本文は左寄せ（mx-autoしない） */
export function BrowseChrome({ children }: { children: ReactNode }) {
  const openCount = DUMMY_WORKS.filter(
    (w) => w.status === "open" || w.status === "pay_soon",
  ).length;

  return (
    <AppShell variant="chrome" openCount={openCount}>
      {children}
    </AppShell>
  );
}
