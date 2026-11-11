import Constants from "expo-constants";
import { Linking, Platform } from "react-native";

import { toast } from "@/components/shared/toast";

const ANDROID_PACKAGE = "com.biodun42.hook";
// The numeric Apple ID exists only once the app is created in App Store Connect.
// Set `extra.appStoreId` in app.json (or EXPO_PUBLIC_APP_STORE_ID) after that.
const appStoreId = (Constants.expoConfig?.extra as { appStoreId?: string } | undefined)?.appStoreId || process.env.EXPO_PUBLIC_APP_STORE_ID;

async function open(urls: string[]) {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      /* try the next one */
    }
  }
  return false;
}

/**
 * "Rate this app" for iOS and Android. The customer tapped it on purpose, so go to the store's
 * review screen rather than the quota-limited in-app prompt; use the in-app prompt only when the
 * store listing isn't known yet (before release).
 */
export async function rateApp() {
  if (Platform.OS === "android") {
    if (await open([`market://details?id=${ANDROID_PACKAGE}`, `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`])) return;
  } else if (appStoreId) {
    if (await open([`itms-apps://itunes.apple.com/app/id${appStoreId}?action=write-review`, `https://apps.apple.com/app/id${appStoreId}?action=write-review`])) return;
  }

  try {
    // Loaded lazily so a build without the native module degrades to the message below.
    const StoreReview = await import("expo-store-review");
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    /* fall through */
  }
  toast.info("Thank you", "Ratings open once Hook is live on the store.");
}
