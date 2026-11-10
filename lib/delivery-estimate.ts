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
