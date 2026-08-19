/** プロフィール編集の端末内控え（Neon前） */
export type LocalProfile = {
  handle: string;
  /** 一言（公開ポートフォリオ向け） */
  bio: string;
  /** アイコン（data URL。デモは端末内のみ） */
  avatarDataUrl?: string;
  updatedAt: string;
};

const KEY = "viscum_local_profile_v1";
const MAX_AVATAR_BYTES = 180_000; // localStorage 圧迫を避ける

export function readLocalProfile(handle: string): LocalProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalProfile;
    if (!parsed || parsed.handle !== handle) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalProfile(profile: LocalProfile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function readAvatarDataUrl(handle: string): string | null {
  return readLocalProfile(handle)?.avatarDataUrl ?? null;
}

/** 正方形に寄せて JPEG data URL 化（端末内デモ用） */
export function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("画像ファイルを選んでください"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas unavailable"));
        return;
      }
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      let quality = 0.88;
      let data = canvas.toDataURL("image/jpeg", quality);
      while (data.length > MAX_AVATAR_BYTES && quality > 0.4) {
        quality -= 0.1;
        data = canvas.toDataURL("image/jpeg", quality);
      }
      if (data.length > MAX_AVATAR_BYTES) {
        reject(new Error("画像が大きすぎます。別の画像を試してください"));
        return;
      }
      resolve(data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした"));
    };
    img.src = url;
  });
}
