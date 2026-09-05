import { Platform } from "react-native";

export const HOOK_TAB_BAR_HEIGHT = 60;
export const HOOK_TAB_BAR_BOTTOM_GAP = 10;
export const HOOK_TAB_BAR_CONTENT_GAP = 14;

/** Height of the floating cart accessory that sits below the native tab bar. */
export const HOOK_TAB_BAR_ACCESSORY_HEIGHT = 56;

export function getHookTabBarContentInset(bottomInset: number) {
  // iOS 26's native tab bar does apply an automatic content inset, but only
  // to the first scroll view and never for the cart accessory sitting below
  // it — and any screen setting contentInsetAdjustmentBehavior="never" opts
  // out entirely. Reserving the space ourselves means content clears the bar
  // regardless of which of those applies.
  if (Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) >= 26) {
    return HOOK_TAB_BAR_ACCESSORY_HEIGHT + HOOK_TAB_BAR_CONTENT_GAP + bottomInset;
  }
  return (
    HOOK_TAB_BAR_HEIGHT +
    HOOK_TAB_BAR_BOTTOM_GAP +
    HOOK_TAB_BAR_CONTENT_GAP
  );
}
