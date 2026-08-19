/** プロフィール編集の端末内控え（Neon前） */
export type LocalProfile = {
  handle: string;
  /** 一言（公開ポートフォリオ向け） */
  bio: string;
  updatedAt: string;
};

const KEY = "viscum_local_profile_v1";

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
