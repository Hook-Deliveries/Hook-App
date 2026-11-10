import type { LockedPrice } from "@/lib/negotiation-types";

type Priced = { effectivePriceMinor: number; sellingPriceMinor: number; discountMinor?: number };

/**
 * What to show for a product's price. With a locked price the customer's price leads and the normal price is struck
 * through; otherwise it is the usual price (with the old price struck through when the product is discounted).
 */
export function displayPrice(product: Priced, lock?: LockedPrice) {
  if (lock) {
    return {
      locked: true as const,
      priceMinor: Math.min(lock.unitPriceMinor, product.effectivePriceMinor),
      strikeMinor: product.effectivePriceMinor,
    };
  }
  return {
    locked: false as const,
    priceMinor: product.effectivePriceMinor,
    strikeMinor: Number(product.discountMinor || 0) > 0 ? product.sellingPriceMinor : undefined,
  };
}
