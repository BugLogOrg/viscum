"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** フィード／詳細と同じ note 系比率 */
export const THUMB_CROP_ASPECT = 1280 / 670;
/** フィード表示幅の約2倍。1280だと JPEG が重く Neon/配信が遅くなる */
const OUT_W = 640;
const OUT_H = 335;

type Props = {
  /** 元画像（object URL や data URL） */
  src: string;
  open: boolean;
  onCancel: () => void;
  /** 切り抜き結果の Blob（JPEG） */
  onApply: (blob: Blob) => void;
  title?: string;
};

function containScale(iw: number, ih: number, vw: number, vh: number) {
  return Math.min(vw / iw, vh / ih);
}

function coverScale(iw: number, ih: number, vw: number, vh: number) {
  return Math.max(vw / iw, vh / ih);
}

function clampPan(
  pan: number,
  display: number,
  view: number,
): number {
  const max = Math.max(0, (display - view) / 2);
  return Math.min(max, Math.max(-max, pan));
}

/**
 * Xのヘッダー／プロフィールに近い「枠に合わせてズーム＆ドラッグ」切り抜き。
 * 依存ライブラリなし（canvas 書き出し）。
 */
export function ImageCropDialog({
  src,
  open,
  onCancel,
  onApply,
  title = "サムネの見え方を調整",
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);

  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [frame, setFrame] = useState({ w: 320, h: 320 / THUMB_CROP_ASPECT });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setBusy(false);
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setFrame({ w, h: w / THUMB_CROP_ASPECT });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const base = natural.w
    ? containScale(natural.w, natural.h, frame.w, frame.h)
    : 1;
  const cover =
    natural.w > 0 ? coverScale(natural.w, natural.h, frame.w, frame.h) : 1;
  /** 1＝全体収まり。枠を埋めるまでは cover/contain 倍まで上げられる */
  const zoomMax = Math.max(3, cover / base);
  const scale = base * zoom;
  const displayW = natural.w * scale;
  const displayH = natural.h * scale;

  useEffect(() => {
    if (!natural.w) return;
    setPanX((p) => clampPan(p, displayW, frame.w));
    setPanY((p) => clampPan(p, displayH, frame.h));
  }, [zoom, natural.w, natural.h, displayW, displayH, frame.w, frame.h]);

  const left = (frame.w - displayW) / 2 + panX;
  const top = (frame.h - displayH) / 2 + panY;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX,
        panY,
      };
    },
    [panX, panY],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const nextX = clampPan(
        d.panX + (e.clientX - d.x),
        displayW,
        frame.w,
      );
      const nextY = clampPan(
        d.panY + (e.clientY - d.y),
        displayH,
        frame.h,
      );
      setPanX(nextX);
      setPanY(nextY);
    },
    [displayW, displayH, frame.w, frame.h],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  async function apply() {
    const img = imgRef.current;
    if (!img || !natural.w) return;
    setBusy(true);
    try {
      // 枠＝ビューポート。画像が枠より小さい（contain）ときは余白を塗りつぶす
      const viewLeft = -left / scale;
      const viewTop = -top / scale;
      const viewRight = (frame.w - left) / scale;
      const viewBottom = (frame.h - top) / scale;
      const viewW = viewRight - viewLeft;
      const viewH = viewBottom - viewTop;

      const sx = Math.max(0, viewLeft);
      const sy = Math.max(0, viewTop);
      const sRight = Math.min(natural.w, viewRight);
      const sBottom = Math.min(natural.h, viewBottom);
      const sw = Math.max(0, sRight - sx);
      const sh = Math.max(0, sBottom - sy);

      const canvas = document.createElement("canvas");
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, OUT_W, OUT_H);
      if (sw > 0 && sh > 0 && viewW > 0 && viewH > 0) {
        const dx = ((sx - viewLeft) / viewW) * OUT_W;
        const dy = ((sy - viewTop) / viewH) * OUT_H;
        const dw = (sw / viewW) * OUT_W;
        const dh = (sh / viewH) * OUT_H;
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      }
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
          "image/jpeg",
          0.82,
        );
      });
      onApply(blob);
    } catch {
      window.alert("切り抜きに失敗しました。別の画像を試してください。");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-3 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="image-crop-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-viscum-line bg-viscum-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-viscum-line px-4 py-3">
          <h2
            id="image-crop-title"
            className="text-[15px] font-semibold text-viscum-ink"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-viscum-muted hover:text-viscum-ink"
          >
            キャンセル
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <p className="text-[12px] leading-relaxed text-viscum-muted">
            最初は枠の中に全体が収まります。ズームで拡大、ドラッグで位置調整。フィードと同じ横長枠（約16:9）です。
          </p>

          <div
            ref={frameRef}
            className="relative w-full cursor-grab touch-none overflow-hidden rounded-md bg-black active:cursor-grabbing"
            style={{ aspectRatio: `${OUT_W} / ${OUT_H}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                width: displayW || undefined,
                height: displayH || undefined,
                left,
                top,
                opacity: natural.w ? 1 : 0,
              }}
              onLoad={(e) => {
                const el = e.currentTarget;
                setNatural({ w: el.naturalWidth, h: el.naturalHeight });
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/35"
              aria-hidden
            />
          </div>

          <label className="block">
            <span className="mb-1 flex justify-between text-[12px] text-viscum-muted">
              <span>ズーム</span>
              <span>{zoom.toFixed(1)}×</span>
            </span>
            <input
              type="range"
              min={1}
              max={zoomMax}
              step={0.01}
              value={Math.min(zoom, zoomMax)}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-viscum-berry"
            />
            {zoomMax > 1.05 && (
              <p className="mt-1 text-[11px] text-viscum-muted">
                {zoom >= cover / base - 0.02
                  ? "枠いっぱい（上下または左右が切れます）"
                  : "上げると枠を埋められます（切れる部分が出ます）"}
              </p>
            )}
          </label>
        </div>

        <div className="flex gap-2 border-t border-viscum-line px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-md border border-viscum-line bg-white px-3 py-2.5 text-[13px] font-medium text-viscum-ink hover:bg-viscum-paper-2"
          >
            やめる
          </button>
          <button
            type="button"
            disabled={busy || !natural.w}
            onClick={() => void apply()}
            className="flex-1 rounded-md bg-viscum-berry px-3 py-2.5 text-[13px] font-medium text-white hover:bg-viscum-berry-deep disabled:opacity-45"
          >
            {busy ? "書き出し中…" : "この枠で使う"}
          </button>
        </div>
      </div>
    </div>
  );
}
