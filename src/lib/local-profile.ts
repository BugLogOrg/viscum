/** プロフィール控え。端末内はフォールバック。本番同期は Neon `/api/profile`（DATABASE_URL）。 */

export type LocalProfile = {
  handle: string;
  /**
   * アカウント名（人の呼び名・メール From／「さん」用）。
   * 英語ID（handle）とは別。未設定時は表示フォールバックで handle を使う。
   */
  accountName?: string;
  /** 一言（公開ポートフォリオ向け） */
  bio: string;
  /** アイコン（data URL） */
  avatarDataUrl?: string;
  updatedAt: string;
};

const KEY_V1 = "viscum_local_profile_v1";
const KEY_V2 = "viscum_local_profiles_v2";
const MAX_AVATAR_BYTES = 180_000;
const MAX_ACCOUNT_NAME = 40;

type ProfileMap = Record<string, LocalProfile>;

function readMap(): ProfileMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw) as ProfileMap;
      return parsed && typeof parsed === "object" ? parsed : {};
    }
    // v1 → v2 移行（1ユーザー分）
    const legacy = localStorage.getItem(KEY_V1);
    if (legacy) {
      const one = JSON.parse(legacy) as LocalProfile;
      if (one?.handle) {
        const map: ProfileMap = { [one.handle]: one };
        localStorage.setItem(KEY_V2, JSON.stringify(map));
        return map;
      }
    }
    return {};
  } catch {
    return {};
  }
}

function writeMap(map: ProfileMap) {
  localStorage.setItem(KEY_V2, JSON.stringify(map));
}

export function readLocalProfile(handle: string): LocalProfile | null {
  if (typeof window === "undefined") return null;
  return readMap()[handle] ?? null;
}

/** 端末に残っている公開プロフィール一覧（検索用） */
export function listLocalProfiles(): LocalProfile[] {
  if (typeof window === "undefined") return [];
  return Object.values(readMap()).filter((p) => Boolean(p?.handle));
}

export function writeLocalProfile(profile: LocalProfile) {
  const map = readMap();
  map[profile.handle] = profile;
  writeMap(map);
}

export function readAvatarDataUrl(handle: string): string | null {
  return readLocalProfile(handle)?.avatarDataUrl ?? null;
}

/** 表示用アカウント名。未設定なら英語ID */
export function displayAccountName(
  handle: string,
  profile?: LocalProfile | null,
): string {
  const p = profile === undefined ? readLocalProfile(handle) : profile;
  const name = p?.accountName?.trim();
  return name || handle;
}

export function normalizeAccountName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_ACCOUNT_NAME);
}

export type RemoteProfile = {
  handle: string;
  accountName: string | null;
  bio: string | null;
  image: string | null;
  persisted: boolean;
};

/** サーバにプロフィールがあれば取る。DATABASE_URL 未設定時は null */
export async function fetchRemoteProfile(
  handle: string,
): Promise<RemoteProfile | null> {
  try {
    const res = await fetch(
      `/api/profile?handle=${encodeURIComponent(handle)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as RemoteProfile;
  } catch {
    return null;
  }
}

export async function saveRemoteProfile(input: {
  accountName: string;
  bio: string;
  image?: string | null;
}): Promise<{ ok: boolean; persisted: boolean; error?: string }> {
  try {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      persisted?: boolean;
      error?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        persisted: false,
        error: data.error || `保存に失敗（${res.status}）`,
      };
    }
    return { ok: true, persisted: Boolean(data.persisted) };
  } catch {
    return { ok: false, persisted: false, error: "ネットワークエラー" };
  }
}

/** 正方形に寄せて JPEG data URL 化 */
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
