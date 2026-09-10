"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PIN_MAX_CONSECUTIVE_WEEKS,
  PIN_PRICE_YEN,
  formatYenJa,
} from "@/lib/seeder-pricing";

type PinState = {
  eligible: boolean;
  reason?: string;
  pinnedUntilIso: string | null;
  isPinned: boolean;
  canExtend: boolean;
  availability: {
    max: number;
    active: number;
    holding: number;
    canPin: boolean;
    nextFreeAtIso: string | null;
  };
  priceYen: number;
};

function fmtJa(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 注目ピン（ADR-069）のセルフサーブ購入。シーダー本人・Neon作品・公開中のときだけ描く。
 * 空いていれば「付ける」、掲載中なら「延長」、満席なら次の空きを出す。運営の手は入らない。
 */
export function PinPurchaseControl({ workId }: { workId: string }) {
  const search = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<PinState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pinParam = search.get("pin");
    const paymentId = search.get("payment");
    void (async () => {
      try {
        if (pinParam === "success" && paymentId) {
          // Webhook 遅延の保険。Stripe に確認して確定させる
          const r = await fetch("/api/checkout/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
          const j = (await r.json().catch(() => null)) as
            | { status?: string; pin?: { refunded?: boolean } }
            | null;
          if (!cancelled) {
            if (j?.pin?.refunded || j?.status === "refunded") {
              setNotice(
                "お支払いの直前に枠が埋まったため、全額返金しました（カード明細への反映は数日かかります）。",
              );
            } else if (j?.status === "paid") {
              setNotice("ピンを付けました。TOPと詳細の「ピン」枠に出ています。");
            }
          }
          router.replace(`/w/${encodeURIComponent(workId)}`, { scroll: false });
        } else if (pinParam === "cancel") {
          router.replace(`/w/${encodeURIComponent(workId)}`, { scroll: false });
        }
        const res = await fetch(
          `/api/checkout/pin?workId=${encodeURIComponent(workId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as PinState;
        if (!cancelled) setState(data);
      } catch {
        // 表示だけの失敗は黙る
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workId, search, router]);

  if (!state) return null;

  const price = formatYenJa(state.priceYen ?? PIN_PRICE_YEN);
  const buy = () => {
    void (async () => {
      setError(null);
      setBusy(true);
      try {
        const res = await fetch("/api/checkout/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workId }),
        });
        const data = (await res.json().catch(() => null)) as
          | { url?: string; error?: string; nextFreeAtIso?: string | null }
          | null;
        if (!res.ok || !data?.url) {
          const next = data?.nextFreeAtIso ? `（次の空き ${fmtJa(data.nextFreeAtIso)}）` : "";
          setError((data?.error ?? "ピンを開始できませんでした") + next);
          return;
        }
        window.location.assign(data.url);
      } finally {
        setBusy(false);
      }
    })();
  };

  const full = !state.isPinned && !state.availability.canPin;

  return (
    <div className="mt-2 border-t border-viscum-line pt-2">
      <p className="text-[12px] font-medium text-viscum-ink">
        ピン
        <span className="ml-1.5 text-[10px] font-normal text-viscum-muted">
          有料掲載・{price}／1週
        </span>
      </p>
      {notice ? (
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-brand">{notice}</p>
      ) : null}
      {state.isPinned ? (
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-ink">
          ピン掲載中（{fmtJa(state.pinnedUntilIso)} まで）。
          {state.canExtend
            ? " 1週だけ延長できます。"
            : ` 連続は最大${PIN_MAX_CONSECUTIVE_WEEKS}週まで。空けてから再度どうぞ。`}
        </p>
      ) : full ? (
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
          今週は満席（{state.availability.active + state.availability.holding}／
          {state.availability.max}）。
          {state.availability.nextFreeAtIso
            ? ` 次の空き ${fmtJa(state.availability.nextFreeAtIso)} 頃。`
            : ""}
        </p>
      ) : !state.eligible && state.reason ? (
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">{state.reason}</p>
      ) : (
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
          TOPと詳細の「ピン」枠に7日間出ます（空き {state.availability.max - state.availability.active - state.availability.holding}／{state.availability.max}）。
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {state.eligible ? (
          <button
            type="button"
            disabled={busy}
            onClick={buy}
            className="rounded-md border border-viscum-brand/50 bg-white px-3 py-1.5 text-[13px] font-medium text-viscum-brand hover:bg-viscum-leaf-soft/60 disabled:opacity-50"
          >
            {state.isPinned ? `1週延長 ${price}` : `注目ピンを付ける ${price}／1週`}
          </button>
        ) : null}
        <span className="text-[11px] leading-relaxed text-viscum-muted">
          開催中の褒賞つきコンペだけ。締切で終わり・日割り返金なし。順位以外は保証しません。
        </span>
      </div>
      {error ? (
        <p className="mt-1 text-[12px] text-viscum-berry-deep">{error}</p>
      ) : null}
    </div>
  );
}
