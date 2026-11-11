import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";

import { toast } from "@/components/shared/toast";

const FEZ_TRACKING_URL = "https://web.fezdelivery.co/track-delivery";

/**
 * Opens Fez's tracking page in an in-app browser. The page has no documented deep link for a
 * tracking number, so the ID is copied first and the customer just pastes it.
 */
export async function openFezTracking(trackingId?: string) {
  if (trackingId) {
    try {
      await Clipboard.setStringAsync(trackingId);
      toast.success("Tracking ID copied. Paste it on the Fez page.");
    } catch {
      /* copying is a convenience; keep going */
    }
  }
  try {
    await WebBrowser.openBrowserAsync(FEZ_TRACKING_URL, { toolbarColor: "#FFFFFF", controlsColor: "#111111" });
  } catch {
    toast.error("Could not open the Fez tracking page");
  }
}
