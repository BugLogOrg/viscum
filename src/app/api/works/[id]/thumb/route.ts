import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNeonWorkRow, isNeonWorkId } from "@/lib/neon-works";

type Ctx = { params: Promise<{ id: string }> };

function parseDataUrl(
  dataUrl: string,
): { mime: string; body: Buffer } | null {
  const m =
    /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,([\s\S]+)$/i.exec(
      dataUrl.trim(),
    );
  if (!m) return null;
  try {
    return {
      mime: (m[1] || "image/jpeg").trim() || "image/jpeg",
      body: Buffer.from(m[2], "base64"),
    };
  } catch {
    return null;
  }
}

/**
 * Neon 作品サムネ。data URL を DB に置いているため、
 * フィード JSON には乗せずここから配信する。
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id: raw } = await ctx.params;
  const id = raw?.trim() ?? "";
  if (!isNeonWorkId(id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const row = await getNeonWorkRow(id);
  if (!row?.thumbUrl?.trim()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (!row.listedOnShelf) {
    const session = await auth();
    if (!session?.user?.id || session.user.id !== row.seederId) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
  }

  const thumb = row.thumbUrl.trim();
  if (thumb.startsWith("http://") || thumb.startsWith("https://")) {
    return NextResponse.redirect(thumb, 302);
  }

  const parsed = parseDataUrl(thumb);
  if (!parsed) {
    return NextResponse.json({ error: "invalid thumb" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(parsed.body), {
    status: 200,
    headers: {
      "Content-Type": parsed.mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Length": String(parsed.body.length),
    },
  });
}
