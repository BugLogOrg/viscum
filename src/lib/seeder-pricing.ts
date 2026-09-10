/**
 * シーダー負担の対外正本（ADR-039 改訂 2026-09-10）。
 *
 *   支払総額 = 褒賞（額面） + 場の手数料 10% + 決済手数料（実費）
 *
 * - 褒賞（メンター向け額面）からは引かない。
 * - 決済手数料は Stripe 国内カードの公表レート（3.6%・固定料なし）を総額に対して転嫁する。
 *   運営は吸収しない。「約」「実費」を付けて表示する。
 * - 例: 褒賞¥5,000 → 手数料¥500 → 決済 約¥206 → 総額 約¥5,706。
 */

export const PLATFORM_FEE_RATE = 0.1;
/** Stripe 国内カード（2026-09 時点）。変わったらここだけ */
export const CARD_PROCESSING_RATE = 0.036;

export type SeederQuote = {
  /** メンターに渡る額面 */
  mentorYen: number;
  /** 場の手数料（10%） */
  feeYen: number;
  /** 決済手数料（実費・概算） */
  processingYen: number;
  /** シーダーがカードで払う総額 */
  totalYen: number;
};

export function quoteSeederCharge(mentorAmountYen: number): SeederQuote {
  const mentorYen = Math.max(0, Math.round(mentorAmountYen));
  if (mentorYen <= 0) {
    return { mentorYen: 0, feeYen: 0, processingYen: 0, totalYen: 0 };
  }
  const feeYen = Math.ceil(mentorYen * PLATFORM_FEE_RATE);
  const subtotal = mentorYen + feeYen;
  // 決済手数料は総額に対して掛かるので、総額 = 小計 / (1 - 率)
  const totalYen = Math.ceil(subtotal / (1 - CARD_PROCESSING_RATE));
  const processingYen = totalYen - subtotal;
  return { mentorYen, feeYen, processingYen, totalYen };
}

/** 注目ピン（ADR-069）: 1週間 ¥3,000 税込・決済込み。褒賞を通さない場の役務 */
export const PIN_PRICE_YEN = 3000;
export const PIN_DURATION_MS = 7 * 86_400_000;
/** 同時最大本数（棚全体） */
export const PIN_MAX_ACTIVE = 3;
/**
 * Checkout 開始時の仮押さえ。Stripe Checkout の有効期限は最短30分なので、
 * 仮押さえも同じ30分に揃える（ズレると払えたのに満席→返金が起きる）。
 */
export const PIN_HOLD_MS = 30 * 60_000;
/** 同一コンペの連続上限（週） */
export const PIN_MAX_CONSECUTIVE_WEEKS = 2;

export function formatYenJa(yen: number): string {
  return `¥${Math.round(yen).toLocaleString("ja-JP")}`;
}

/** 画面用の一行: 「褒賞¥5,000＋手数料¥500＋決済 約¥206 ＝ 約¥5,706」 */
export function describeSeederQuote(q: SeederQuote): string {
  if (q.totalYen <= 0) return "無料（上乗せなし）";
  return `褒賞${formatYenJa(q.mentorYen)}＋場の手数料${formatYenJa(q.feeYen)}＋決済手数料 約${formatYenJa(q.processingYen)}（実費）＝ 約${formatYenJa(q.totalYen)}`;
}
