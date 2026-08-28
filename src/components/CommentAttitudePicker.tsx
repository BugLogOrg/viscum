"use client";

import {
  COMMENT_ATTITUDES,
  type CommentAttitudeId,
} from "@/lib/protocol-colors";
import { ProtocolMark } from "@/components/ProtocolMark";

const CHIP: Record<
  CommentAttitudeId,
  { idle: string; on: string }
> = {
  green: {
    idle:
      "border-viscum-protocol-green/40 bg-viscum-protocol-green-soft text-viscum-ink",
    on: "border-viscum-protocol-green bg-viscum-protocol-green-soft ring-2 ring-viscum-protocol-green",
  },
  blue: {
    idle:
      "border-viscum-protocol-blue/40 bg-viscum-protocol-blue-soft text-viscum-ink",
    on: "border-viscum-protocol-blue bg-viscum-protocol-blue-soft ring-2 ring-viscum-protocol-blue",
  },
  red: {
    idle:
      "border-viscum-protocol-red/40 bg-viscum-protocol-red-soft text-viscum-ink",
    on: "border-viscum-protocol-red bg-viscum-protocol-red-soft ring-2 ring-viscum-protocol-red",
  },
};

/** コメント投稿: 緑／青／赤のいずれか必須。色＋アイコン＋語＋説明 */
export function CommentAttitudePicker({
  value,
  onChange,
}: {
  value: CommentAttitudeId | null;
  onChange: (id: CommentAttitudeId) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-[12px] font-medium text-viscum-ink">
        このコメントの態度 <span className="text-viscum-berry">必須</span>
      </legend>
      <p className="text-[11px] leading-relaxed text-viscum-muted">
        色とアイコンと短い語で選びます。気になる（あとで戻る）は別ボタンです。
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {COMMENT_ATTITUDES.map((c) => {
          const on = value === c.id;
          const styles = CHIP[c.id as CommentAttitudeId];
          return (
            <button
              key={c.id}
              type="button"
              title={c.attitude}
              aria-pressed={on}
              onClick={() => onChange(c.id as CommentAttitudeId)}
              className={`rounded-md border px-2.5 py-2 text-left transition ${
                on ? styles.on : styles.idle
              }`}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-viscum-ink">
                <ProtocolMark id={c.id} className="h-4 w-4" />
                {c.label}
                {c.labelStatus === "provisional" ? (
                  <span className="text-[10px] font-normal text-viscum-muted">
                    仮
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-[11px] leading-snug text-viscum-muted">
                {c.attitude}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
