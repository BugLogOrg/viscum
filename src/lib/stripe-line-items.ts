import type Stripe from "stripe";
import type { SeederQuote } from "@/lib/seeder-pricing";

/**
 * シーダー請求の Checkout 明細（ADR-039 改訂 2026-09-10）。
 * 褒賞／場の手数料10%／決済手数料（実費）を3行で並記し、総額を隠さない。
 */
export function seederChargeLineItems(
  quote: SeederQuote,
  opts: { rewardName: string; rewardDescription?: string },
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "jpy",
        unit_amount: quote.mentorYen,
        product_data: {
          name: opts.rewardName,
          ...(opts.rewardDescription
            ? { description: opts.rewardDescription }
            : {}),
        },
      },
    },
    {
      quantity: 1,
      price_data: {
        currency: "jpy",
        unit_amount: quote.feeYen,
        product_data: {
          name: "場の手数料（褒賞の10%）",
          description: "Viscum の運営手数料。税金ではありません",
        },
      },
    },
  ];
  if (quote.processingYen > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "jpy",
        unit_amount: quote.processingYen,
        product_data: {
          name: "決済手数料（実費）",
          description: "カード決済の実費（約3.6%）。運営は受け取りません",
        },
      },
    });
  }
  return items;
}
