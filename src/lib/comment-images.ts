/**
 * コメント添付用のクライアント圧縮（Blob 送信前・必須）。
 * 方針: Vercel Hobby 無料枠内（課金しない）。超過しても請求されず枠が止まるだけだが、
 * スクショ用途なら圧縮で十分収まる想定。
 */

/** 指摘スクショ用途。枚数より1枚の軽さを優先 */
export const MAX_COMMENT_IMAGES = 6;
/** 圧縮後の目安バイト（1枚）。Hobby 保存枠を食いすぎない */
export const COMMENT_IMAGE_MAX_BYTES = 280_000;
/** data URL フォールバック時の文字列長目安（base64膨張込み） */
export const COMMENT_IMAGE_TARGET_CHARS = 380_000;
/** 長辺。UI指摘なら 1280 で足りる */
export const COMMENT_IMAGE_MAX_EDGE = 1280;

/** File → JPEG File（長辺制限＋品質調整・必須） */
export function compressImageForComment(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("画像ファイルを選んでください"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(
        1,
        COMMENT_IMAGE_MAX_EDGE / Math.max(img.width, img.height),
      );
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.82;
      const toBlob = (): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("圧縮に失敗しました"));
              return;
            }
            if (blob.size > COMMENT_IMAGE_MAX_BYTES && quality > 0.4) {
              quality -= 0.1;
              toBlob();
              return;
            }
            if (blob.size > COMMENT_IMAGE_MAX_BYTES) {
              reject(
                new Error(
                  "圧縮しても大きすぎます。別のスクショか切り抜きを試してください",
                ),
              );
              return;
            }
            const name = file.name.replace(/\.\w+$/, "") || "shot";
            resolve(
              new File([blob], `${name}.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              }),
            );
          },
          "image/jpeg",
          quality,
        );
      };
      toBlob();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした"));
    };
    img.src = url;
  });
}

/** Blob 未設定時のデモ用: data URL（端末内のみ） */
export function fileToCommentDataUrl(file: File): Promise<string> {
  return compressImageForComment(file).then(
    (compressed) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const data = String(reader.result ?? "");
          if (data.length > COMMENT_IMAGE_TARGET_CHARS) {
            reject(
              new Error(
                "画像が大きすぎます。別の画像か、もう少し小さくしてください",
              ),
            );
            return;
          }
          resolve(data);
        };
        reader.onerror = () => reject(new Error("読み込みに失敗しました"));
        reader.readAsDataURL(compressed);
      }),
  );
}
