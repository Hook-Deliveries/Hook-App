import { Linking } from "react-native";
import { HELP_URL } from "@/lib/web-links";

// "Help & support" opens the help page on the Hook website. Its address comes from EXPO_PUBLIC_WEB_URL (see web-links.ts).
export async function openSupport() {
  await Linking.openURL(HELP_URL);
}

// The same page, with the order passed along so support can pick it up.
export async function openOrderSupport(orderId: string) {
  await Linking.openURL(`${HELP_URL}?orderId=${encodeURIComponent(orderId)}`);
}
