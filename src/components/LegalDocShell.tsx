import Link from "next/link";
import type { ReactNode } from "react";
import { ViscumMark } from "@/components/ViscumMark";
import { SiteFooter } from "@/components/SiteFooter";

/** 利用規約・プライバシー共通の薄い枠 */
export function LegalDocShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-viscum-paper text-viscum-ink">
      <header className="border-b border-viscum-line px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.12em] text-viscum-brand"
          >
            <ViscumMark className="h-7 w-7" />
            VISCUM
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-viscum-ink">
            {title}
          </h1>
          <p className="mt-1 text-[12px] text-viscum-muted">
            最終更新: {updated}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-10 text-[14px] leading-relaxed text-viscum-ink">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-[16px] font-semibold text-viscum-brand">{title}</h2>
      <div className="space-y-2 text-viscum-ink/95">{children}</div>
    </section>
  );
}
