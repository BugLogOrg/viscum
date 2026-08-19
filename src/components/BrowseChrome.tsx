"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { DUMMY_WORKS } from "@/data/dummy-works";

/** 作品詳細・PFなど閲覧面。左カラム常時＋シードCTAは左ナビのみ */
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
