import { getWork } from "@/data/dummy-works";

export type ReactionKind = "suki" | "bookmark";

export type LocalReaction = {
  id: string;
  workId: string;
  kind: ReactionKind;
  /** 押した時点のタイトル控え */
  title: string;
  /** ISO。打刻 */
  createdAt: string;
};

const KEY = "viscum_local_reactions_v1";

export function readLocalReactions(): LocalReaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalReaction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalReactions(rows: LocalReaction[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 200)));
}

export function reactionsForKind(kind: ReactionKind): LocalReaction[] {
  return readLocalReactions()
    .filter((r) => r.kind === kind)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function hasReaction(workId: string, kind: ReactionKind): boolean {
  return readLocalReactions().some(
    (r) => r.workId === workId && r.kind === kind,
  );
}

/** トグル。ONなら打刻付きで追加、OFFなら削除 */
export function toggleReaction(
  workId: string,
  kind: ReactionKind,
  title?: string,
): { on: boolean; row: LocalReaction | null } {
  const all = readLocalReactions();
  const i = all.findIndex((r) => r.workId === workId && r.kind === kind);
  if (i >= 0) {
    all.splice(i, 1);
    writeLocalReactions(all);
    return { on: false, row: null };
  }
  const work = getWork(workId);
  const row: LocalReaction = {
    id: `rx_${kind}_${Date.now().toString(36)}`,
    workId,
    kind,
    title: title ?? work?.title ?? workId,
    createdAt: new Date().toISOString(),
  };
  writeLocalReactions([row, ...all]);
  return { on: true, row };
}

export function formatReactionStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

const DEMO_RX = "demo_rx_";

/** 一覧の見た目確認用（打刻つき）。気になるのみ（ADR-036） */
export function installDemoReactions(): LocalReaction[] {
  const now = Date.now();
  const demos: LocalReaction[] = [
    {
      id: `${DEMO_RX}bm1`,
      workId: "note-clip",
      kind: "bookmark",
      title: "朝起きてすぐ三行だけ書けばいいメモアプリのβです…",
      createdAt: new Date(now - 26 * 3600000).toISOString(),
    },
    {
      id: `${DEMO_RX}bm2`,
      workId: "viscum-self",
      kind: "bookmark",
      title: "Viscum（ヤドリギ候補）自体の初見レビュー募集…",
      createdAt: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      id: `${DEMO_RX}bm3`,
      workId: "cli-tool",
      kind: "bookmark",
      title: "READMEとgifだけ見てもらうCLIツールのドキュメント初見…",
      createdAt: new Date(now - 5 * 86400000).toISOString(),
    },
  ];
  const rest = readLocalReactions().filter((r) => !r.id.startsWith(DEMO_RX));
  writeLocalReactions([...demos, ...rest]);
  return demos;
}

export function clearDemoReactions() {
  writeLocalReactions(
    readLocalReactions().filter((r) => !r.id.startsWith(DEMO_RX)),
  );
}

export function hasDemoReactions() {
  return readLocalReactions().some((r) => r.id.startsWith(DEMO_RX));
}
