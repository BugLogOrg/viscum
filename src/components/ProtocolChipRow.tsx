"use client";

import { useState } from "react";
import {
  PROTOCOL_COLORS,
  type ProtocolColorId,
} from "@/lib/protocol-colors";
import { ProtocolMark } from "@/components/ProtocolMark";

const CHIP_CLASS: Record<ProtocolColorId, { idle: string; on: string }> = {
  green: {
    idle:
      "border-viscum-protocol-green/40 bg-viscum-protocol-green-soft text-viscum-ink",
    on: "border-viscum-protocol-green bg-viscum-protocol-green text-white",
  },
  blue: {
    idle:
      "border-viscum-protocol-blue/40 bg-viscum-protocol-blue-soft text-viscum-ink",
    on: "border-viscum-protocol-blue bg-viscum-protocol-blue text-white",
  },
  yellow: {
    idle:
      "border-viscum-protocol-yellow/50 bg-viscum-protocol-yellow-soft text-viscum-ink",
    on: "border-viscum-protocol-yellow bg-viscum-protocol-yellow text-viscum-ink",
  },
  red: {
    idle:
      "border-viscum-protocol-red/40 bg-viscum-protocol-red-soft text-viscum-ink",
    on: "border-viscum-protocol-red bg-viscum-protocol-red text-white",
  },
};

/** 見本: 色＋アイコン＋語（CUD） */
export function ProtocolChipRow({
  value,
  onChange,
}: {
  value: ProtocolColorId | null;
  onChange: (id: ProtocolColorId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="反応の色">
      {PROTOCOL_COLORS.map((c) => {
        const on = value === c.id;
        const styles = CHIP_CLASS[c.id];
        return (
          <button
            key={c.id}
            type="button"
            title={c.attitude}
            aria-pressed={on}
            onClick={() => onChange(c.id)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] font-medium transition ${
              on ? styles.on : styles.idle
            }`}
          >
            <ProtocolMark
              id={c.id}
              filled={c.id === "yellow" && on}
              className={`h-3.5 w-3.5 ${on && c.id !== "yellow" ? "text-white" : ""}`}
            />
            <span>{c.label}</span>
            {c.labelStatus === "provisional" ? (
              <span className="text-[10px] font-normal opacity-70">仮</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function ProtocolChipDemo() {
  const [picked, setPicked] = useState<ProtocolColorId | null>("yellow");
  return (
    <div className="space-y-2">
      <ProtocolChipRow value={picked} onChange={setPicked} />
      <p className="text-[12px] text-viscum-muted">
        選択中:{" "}
        <span className="font-medium text-viscum-ink">
          {picked
            ? PROTOCOL_COLORS.find((c) => c.id === picked)?.label
            : "なし"}
        </span>
        （色＋アイコン＋語）
      </p>
    </div>
  );
}
