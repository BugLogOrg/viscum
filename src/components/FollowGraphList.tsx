"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  accountLabelForHandle,
  getDemoSeederProfile,
  isDemoSeederHandle,
  THUMB_TONE_CLASS,
} from "@/data/suggested-seeders";
import { displayAccountName, readLocalProfile } from "@/lib/local-profile";
import { FollowButton } from "@/components/FollowButton";
import { DemoBadge } from "@/components/DemoBadge";

type Row = {
  handle: string;
  displayName: string;
  bio: string;
  glyph: string;
  toneClass: string;
  isDemo: boolean;
};

function rowForHandle(handle: string): Row {
  const h = handle.replace(/^@/, "").trim();
  const demo = getDemoSeederProfile(h);
  const label = accountLabelForHandle(h);
  const localName =
    typeof window !== "undefined"
      ? displayAccountName(h, readLocalProfile(h))
      : h;
  const displayName =
    demo?.displayName ||
    (localName.toLowerCase() !== h.toLowerCase() ? localName : label.accountName);
  const bio = demo?.bio ?? readLocalProfile(h)?.bio?.trim() ?? "";
  const glyph = demo?.glyph ?? displayName.slice(0, 1).toUpperCase();
  const toneClass = demo
    ? `${THUMB_TONE_CLASS[demo.thumbTone]} ${demo.thumbTone === "bark" ? "text-viscum-ink" : "text-white"}`
    : "bg-viscum-berry text-white";
  return {
    handle: h,
    displayName,
    bio,
    glyph,
    toneClass,
    isDemo: isDemoSeederHandle(h),
  };
}

/** フォロー／フォロワー一覧。各行でフォロー可 */
export function FollowGraphList({
  handles,
  emptyText,
  loginCallbackUrl,
}: {
  handles: string[];
  emptyText: string;
  loginCallbackUrl: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    setRows(handles.map(rowForHandle));
  }, [handles.join("|")]);

  if (handles.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-[13px] leading-relaxed text-viscum-muted">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-viscum-line">
      {rows.map((r) => (
        <li key={r.handle} className="flex items-center gap-2 px-3 py-2.5">
          <Link
            href={`/u/${encodeURIComponent(r.handle)}`}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${r.toneClass}`}
              aria-hidden
            >
              {r.glyph}
            </span>
            <span className="min-w-0">
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate text-[14px] font-medium text-viscum-ink">
                  {r.displayName}
                </span>
                <span className="shrink-0 text-[12px] text-viscum-muted">
                  @{r.handle}
                </span>
                {r.isDemo ? <DemoBadge /> : null}
              </span>
              {r.bio ? (
                <span className="mt-0.5 block truncate text-[11px] text-viscum-muted">
                  {r.bio}
                </span>
              ) : null}
            </span>
          </Link>
          <FollowButton
            handle={r.handle}
            loginCallbackUrl={loginCallbackUrl}
          />
        </li>
      ))}
    </ul>
  );
}
