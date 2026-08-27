import { formatDateTime, formatYen } from "@/data/dummy-works";

/** workSummary から概要と聞きたいことを分ける（新旧マーカー両対応） */
export function splitRequestSummary(raw: string | null | undefined): {
  description: string;
  prompts: string[];
} {
  const text = (raw ?? "").trim();
  if (!text) return { description: "", prompts: [] };
  const markers = ["【聞きたいこと】", "【聞くこと】"] as const;
  let marker = "";
  let i = -1;
  for (const m of markers) {
    const at = text.indexOf(m);
    if (at >= 0 && (i < 0 || at < i)) {
      i = at;
      marker = m;
    }
  }
  if (i < 0 || !marker) return { description: text, prompts: [] };
  return {
    description: text.slice(0, i).trim(),
    prompts: text
      .slice(i + marker.length)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/** 未ログイン着地用。聞きたいこと抜き・短文の概要だけ */
export function inviteTeaserSummary(
  workSummary: string | null | undefined,
  max = 140,
): string {
  const { description } = splitRequestSummary(workSummary);
  const t = description.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export type DirectRequestOfferSnapshot = {
  fromDisplayName: string;
  fromHandle: string;
  workTitle: string;
  workExternalUrl?: string;
  workThumbUrl?: string;
  workSummary?: string;
  pitch?: string;
  amountYen: number;
  createdAt?: string;
  closesAt?: string;
};

export function formatOfferPostedLine(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return formatDateTime(d);
}

export function formatOfferDeadlineLine(iso?: string): string | null {
  if (!iso) return null;
  const closes = new Date(iso);
  if (!Number.isFinite(closes.getTime())) return null;
  const ms = closes.getTime() - Date.now();
  if (ms <= 0) return `${formatDateTime(closes)}（終了）`;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const left =
    days > 0 ? `あと${days}日` : hours > 0 ? `あと${hours}時間` : "まもなく";
  return `${formatDateTime(closes)}（${left}）`;
}

export function formatOfferAmount(yen: number): string {
  return formatYen(yen);
}
