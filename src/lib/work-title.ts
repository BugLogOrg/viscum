/** 作品タイトルの上限（OGカード・フィードに収める） */
export const WORK_TITLE_MAX = 100;

/** 説明（背景・文脈）の上限 */
export const WORK_DESCRIPTION_MAX = 1000;

export function clampWorkTitle(title: string): string {
  const t = title.trim();
  if (t.length <= WORK_TITLE_MAX) return t;
  return `${t.slice(0, WORK_TITLE_MAX - 1)}…`;
}
