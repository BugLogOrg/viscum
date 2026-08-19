"use client";

import { useEffect, useState } from "react";
import { readLocalProfile } from "@/lib/local-profile";

/** 公開ポートフォリオに載せる一言（端末内プロフィール） */
export function PortfolioBio({ handle }: { handle: string }) {
  const [bio, setBio] = useState<string | null>(null);

  useEffect(() => {
    const p = readLocalProfile(handle);
    setBio(p?.bio?.trim() ? p.bio.trim() : null);
  }, [handle]);

  if (!bio) return null;
  return (
    <p className="mt-2 text-[14px] leading-relaxed text-viscum-ink">{bio}</p>
  );
}
