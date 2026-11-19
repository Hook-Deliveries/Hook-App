import type { LogisticsProvider } from "@/lib/mobile-api";

type StateRef = { publicId?: string; code?: string; name?: string } | null | undefined;

/**
 * The delivery-time message the admin set for a courier, for the customer's delivery State: the message of the group that
 * lists their State, else the courier's "all other States" message, else nothing. Mirrors the backend resolver so the
 * checkout shows exactly what the admin configured.
 */
export function deliveryEstimateFor(provider: Pick<LogisticsProvider, "deliveryEstimates" | "defaultEstimate"> | undefined, state: StateRef): string | undefined {
  if (!provider) return undefined;
  const keys = [state?.publicId, state?.code, state?.name].filter(Boolean).map((value) => String(value).trim().toLowerCase());
  if (keys.length) {
    const rule = (provider.deliveryEstimates || []).find((candidate) => candidate.stateIds.some((id) => keys.includes(String(id).trim().toLowerCase())));
    if (rule?.message) return rule.message;
  }
  return provider.defaultEstimate?.trim() || undefined;
}

/** The first courier message that applies to this State, for when the customer has not picked a courier yet. */
export function firstDeliveryEstimate(providers: Array<Pick<LogisticsProvider, "deliveryEstimates" | "defaultEstimate">>, state: StateRef): string | undefined {
  return providers.map((provider) => deliveryEstimateFor(provider, state)).find(Boolean);
}

/**
 * Admins write the message as they like: a full sentence ("Delivers in 2 to 5 days") or just the time ("24 to 48 hours").
 * A full sentence is shown as written; a bare time gets a lead-in so it never reads as a fragment, and the two are
 * never stacked into "Arrives in Delivers in 2 to 5 days".
 */
export function deliveryPhrase(message: string): string {
  const text = message.trim();
  return /^(usually|typically|delivers?|delivered|arrives?|arriving|expect|within|ready|same|next)\b/i.test(text) ? text : `Usually arrives in ${text}`;
}
