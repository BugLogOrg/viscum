/** コメント添付用のクライアント圧縮（Blob 送信前） */

export const MAX_COMMENT_IMAGES = 8;
/** 圧縮後の目安（1枚）。data URL フォールバック時も同じ */
export const COMMENT_IMAGE_TARGET_CHARS = 420_000;
export const COMMENT_IMAGE_MAX_EDGE = 1600;

/** File → JPEG File（長辺制限＋品質調整） */
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
      let quality = 0.86;
      const toBlob = (): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("圧縮に失敗しました"));
              return;
            }
            // data URL 長の目安に寄せて再圧縮
            if (blob.size > COMMENT_IMAGE_TARGET_CHARS * 0.75 && quality > 0.45) {
              quality -= 0.12;
              toBlob();
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
