import { NextResponse } from "next/server";
import { hasDatabase } from "@/db";
import { getPinAvailability } from "@/lib/pin-slots";
import { PIN_MAX_ACTIVE, PIN_PRICE_YEN } from "@/lib/seeder-pricing";

export const dynamic = "force-dynamic";

/** ピン枠の空き（公開情報・ログイン不要）。投稿フォームの☑表示用 */
export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({
      max: PIN_MAX_ACTIVE,
      active: 0,
      holding: 0,
      canPin: false,
      nextFreeAtIso: null,
      priceYen: PIN_PRICE_YEN,
      persisted: false,
    });
  }
  const a = await getPinAvailability();
  return NextResponse.json({ ...a, priceYen: PIN_PRICE_YEN, persisted: true });
}
