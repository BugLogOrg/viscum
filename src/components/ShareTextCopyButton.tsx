"use client";

import { useState } from "react";

type Props = {
  /** コピーする本文。null なら emptyHint を出す */
  getText: () => string | null | undefined;
  label?: string;
  emptyHint?: string;
  className?: string;
};

/** 告知文・案内文のクリップボードコピー */
export function ShareTextCopyButton({
  getText,
  label = "告知文をコピー",
  emptyHint = "コピーできる文がありません",
  className = "rounded-md border border-viscum-brand px-2.5 py-1 text-[12px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft",
}: Props) {
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const text = getText()?.trim();
        if (!text) {
          setFlash(emptyHint);
          window.setTimeout(() => setFlash(null), 2800);
          return;
        }
        void (async () => {
          try {
            await navigator.clipboard?.writeText(text);
            setFlash("コピーしました");
          } catch {
            setFlash("コピーに失敗しました");
          }
          window.setTimeout(() => setFlash(null), 2000);
        })();
      }}
    >
      {flash ?? label}
    </button>
  );
}
