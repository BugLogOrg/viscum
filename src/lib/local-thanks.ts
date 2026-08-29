/** シーダーのお礼（端末内・デモ／Neon補完） */
const prefix = "viscum_local_thanks_v1_";

export function readLocalThanks(workId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(prefix + workId);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function writeLocalThanks(workId: string, ids: Set<string>) {
  localStorage.setItem(
    prefix + workId,
    JSON.stringify([...ids].slice(0, 200)),
  );
}

export function addLocalThanks(workId: string, commentId: string): Set<string> {
  const next = readLocalThanks(workId);
  next.add(commentId);
  writeLocalThanks(workId, next);
  return next;
}

export function withLocalThanks<T extends { id: string; thanked?: boolean }>(
  workId: string,
  comments: T[],
): T[] {
  const thanks = readLocalThanks(workId);
  if (thanks.size === 0) return comments;
  return comments.map((c) =>
    c.thanked || thanks.has(c.id) ? { ...c, thanked: true } : c,
  );
}
