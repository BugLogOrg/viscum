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
        作品・プロダクトへのレビュー態度です。気になる（あとで戻る）は別ボタン。
      </p>
      <div className="grid gap-2 sm:grid-cols-3 sm:items-stretch">
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
              className={`grid h-full grid-cols-[2rem_1fr] grid-rows-[auto_1fr] gap-x-2 gap-y-1 rounded-md border px-2.5 py-2 text-left transition ${
                on ? styles.on : styles.idle
              }`}
            >
              <ProtocolMark
                id={c.id}
                className="block h-8 w-8"
              />
              <span className="min-w-0 self-center text-[13px] font-medium leading-none text-viscum-ink">
                {c.label}
              </span>
              <span className="col-start-2 text-[11px] leading-snug text-viscum-muted">
                {c.attitude}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
