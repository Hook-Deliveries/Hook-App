import { ApiError } from "@/lib/api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The server answered "try again shortly", or could not be reached for a moment. */
export function isTemporarilyUnavailable(error: unknown) {
  return error instanceof ApiError && [0, 502, 503, 504].includes(error.status ?? -1);
}

/**
 * Runs a sign-in request and, when the server is only briefly unavailable, tries once more straight away. Sign-in is
 * safe to repeat, and most of these blips clear within a second, so the customer simply gets in instead of seeing an
 * error and having to tap again.
 */
export async function retryOnUnavailable<T>(run: () => Promise<T>, attempts = 2, delayMs = 1200): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= attempts || !isTemporarilyUnavailable(error)) throw error;
      await sleep(delayMs);
    }
  }
}
