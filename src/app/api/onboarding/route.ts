import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, hasDatabase } from "@/db";
import { users } from "@/db/schema";
import { DEMO_SPECIALTIES } from "@/data/specialties";

const ALLOWED = new Set<string>([...DEMO_SPECIALTIES]);

/** 初回ウェルカム：専門タグ保存＋オンボーディング完了 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "database unavailable" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    specialties?: string[];
    skip?: boolean;
  } | null;

  const raw = Array.isArray(body?.specialties) ? body!.specialties : [];
  const specialties = [
    ...new Set(
      raw
        .map((s) => String(s).trim())
        .filter((s) => ALLOWED.has(s)),
    ),
  ].slice(0, DEMO_SPECIALTIES.length);

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "database unavailable" },
      { status: 503 },
    );
  }

  await db
    .update(users)
    .set({
      specialties,
      onboardingCompletedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return NextResponse.json({
    ok: true,
    specialties,
    skipped: Boolean(body?.skip) && specialties.length === 0,
  });
}
