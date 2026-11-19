/**
 * The one public web address for Hook. Every link that opens the website (help and support, account deletion, ...)
 * is built from it, so moving the site means changing a single value: EXPO_PUBLIC_WEB_URL.
 *
 * Expo inlines EXPO_PUBLIC_* values when the app is built, so the variable has to be read as written below.
 */
const DEFAULT_WEB_URL = "https://app.hook.africa";

export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || DEFAULT_WEB_URL).trim().replace(/\/+$/, "");

/** A page on the Hook website, e.g. webUrl("/help") -> https://app.hook.africa/help */
export const webUrl = (path: string) => `${WEB_URL}/${path.replace(/^\/+/, "")}`;

/** Help and support. */
export const HELP_URL = webUrl("/help");

/** Where a customer can request or cancel account deletion without the app. */
export const DELETE_ACCOUNT_URL = webUrl("/delete-account");

/** The shop website (orders, payments and public parcel tracking live here, not on the help/legal site). */
export const SHOP_URL = (process.env.EXPO_PUBLIC_SHOP_URL || "https://shop.hook.africa").trim().replace(/\/+$/, "");

/** What a receipt's QR code opens: the parcel's public tracking page. Signed, so it cannot be guessed. */
export const parcelTrackingUrl = (receiptNumber: string, signature?: string) =>
  `${SHOP_URL}/track/${encodeURIComponent(receiptNumber)}${signature ? `?s=${encodeURIComponent(signature)}` : ""}`;
