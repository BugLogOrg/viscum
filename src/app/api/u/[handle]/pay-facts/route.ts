import { NextResponse } from "next/server";
import { seederPayFactsForHandle } from "@/db/payment-facts";

type Ctx = { params: Promise<{ handle: string }> };

/** 層B: シーダー支払い実績（公開確認用） */
export async function GET(_req: Request, ctx: Ctx) {
  const { handle: raw } = await ctx.params;
  const handle = decodeURIComponent(raw ?? "").replace(/^@/, "").trim();
  if (!handle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }
  const pay = await seederPayFactsForHandle(handle);
  return NextResponse.json({
    handle: pay.handle,
    paymentsCount: pay.paymentsCount,
    paidYenTotal: pay.paidYenTotal,
  });
}
