export interface NegotiationMessage {
  sequence?: number;
  requestId?: string;
  id?: string;
  kind?: "text" | "suggestions" | "action" | "receipt";
  role: "customer" | "hook";
  message: string;
  createdAt?: string;
  offeredPriceMinor?: number;
  productIds?: string[];
  actionId?: string;
  quantity?: number;
}

export interface NegotiationResponse {
  version?: number;
  processing?: boolean;
  shoppingEnabled?: boolean;
  peopleNegotiating?: number;
  negotiationId: string;
  status: "active" | "agreed" | "closed" | "expired" | "declined";
  transcript?: NegotiationMessage[];
  message?: string;
  entry?: NegotiationMessage;
  variantId?: string;
  quantity?: number;
  remainingOffers?: number;
  maximumOffers?: number;
  offerCount?: number;
  expiresAt?: string;
  sessionMode?: "fixed" | "unlimited";
  counterPriceMinor?: number;
  lastCounterPriceMinor?: number;
  agreedPriceMinor?: number;
  quoteId?: string;
  /** Why the session ended without the customer deciding, e.g. the product went off sale. */
  endReason?: string;
  /** Set when the product's price changed since the last offer; amounts in kobo. */
  priceChanged?: { fromMinor: number; toMinor: number };
  quote?: {
    id: string;
    agreedPriceMinor: number;
    originalPriceMinor?: number;
    expiresAt: string;
    /** `cancelled` means the product changed and the price can no longer be used. */
    status: "active" | "used" | "expired" | "cancelled" | string;
    voidReason?: "PRODUCT_UNAVAILABLE" | "NEGOTIATION_DISABLED" | "FLOOR_RAISED";
  };
  product?: {
    id: string;
    title: string;
    imageUrl?: string;
    effectivePriceMinor: number;
    currency?: string;
    description?: string;
    market?: { name: string };
  };
}

/**
 * The guided offer flow. Every amount is a TOTAL for the whole quantity (with the per-item price beside it), in kobo.
 * The server decides every price; the app only shows them.
 */
export interface NegotiationFlow {
  negotiationId: string;
  status: "active" | "agreed" | "closed" | "expired" | "declined";
  endReason?: string;
  productId?: string;
  variantId?: string;
  quantity: number;
  currency: string;
  listUnitMinor: number;
  listTotalMinor: number;
  /** The round the next offer will be (1-based). */
  round: number;
  remainingOffers: number;
  maximumOffers: number;
  expiresAt?: string;
  /** Hook's best price so far: its latest counter, or the price it accepted, whichever is lower. */
  counter?: { unitMinor: number; totalMinor: number; percentOff: number };
  /** Hook has accepted this price but it is not locked, because offers remain: lock it, or try for less. */
  priceAccepted: boolean;
  /** This is the customer's final offer. */
  lastRound: boolean;
  /** Halfway between the customer's best offer and Hook's price, when the gap is wide enough to be worth a step. */
  midpoint?: { unitMinor: number; totalMinor: number; percentOff: number };
  bestOffer?: { unitMinor: number; totalMinor: number };
  locked?: {
    quoteId: string;
    unitMinor: number;
    totalMinor: number;
    savingsTotalMinor: number;
    percentOff: number;
    expiresAt: string;
  };
  quoteCancelled?: { reason?: string };
  /** Offers must be at least this much, and below `maxTotalMinor` (Hook's last counter, or the list price). */
  minTotalMinor: number;
  maxTotalMinor: number;
  suggestions: Array<{ unitMinor: number; totalMinor: number; percentOff: number; note?: string }>;
  history: Array<{
    round: number;
    offerTotalMinor: number;
    decision?: "ACCEPT" | "COUNTER" | "DECLINE";
    counterTotalMinor?: number;
    acceptedTotalMinor?: number;
  }>;
}

export interface NegotiationOfferOutcome {
  result: {
    decision?: "ACCEPT" | "COUNTER" | "DECLINE";
    message?: string;
    offerTotalMinor: number;
    counterTotalMinor?: number;
    acceptedTotalMinor?: number;
    providerFallback: boolean;
  };
  flow: NegotiationFlow;
}

/** A price the customer locked for a product: it applies at any quantity and in any option until `expiresAt`. */
export interface LockedPrice {
  quoteId: string;
  /** The product's public id, so any screen showing that product can look its locked price up. */
  productId: string;
  unitPriceMinor: number;
  listUnitMinor: number;
  percentOff: number;
  expiresAt: string;
}
