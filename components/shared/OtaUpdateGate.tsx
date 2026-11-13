import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isPaymentFlowActive, onPaymentFlowChanged } from "@/lib/payment-flow";

// A development build made before expo-updates was linked has no ExpoUpdates native module, and
// importing the package then throws at startup. Load it guarded so such builds still run.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Updates: typeof import("expo-updates") | null = (() => { try { return require("expo-updates"); } catch { return null; } })();

/** Look for an update at most this often when the app comes back to the foreground. */
const CHECK_EVERY_MS = 10 * 60_000;

/**
 * Over-the-air updates. Expo already checks when the app launches and applies a downloaded update on the next launch.
 * This adds two things: a check whenever the app returns to the foreground (people rarely close it), and a small
 * "restart to update" prompt once an update has finished downloading. The prompt never appears during a payment, and
 * the app is never restarted without the customer's tap. Does nothing in development, where updates are off.
 */
export function OtaUpdateGate() {
  return Updates ? <OtaUpdateGateInner Updates={Updates} /> : null;
}

function OtaUpdateGateInner({ Updates }: { Updates: typeof import("expo-updates") }) {
  const insets = useSafeAreaInsets();
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [paymentActive, setPaymentActive] = useState(isPaymentFlowActive());
  const lastCheck = useRef(0);

  useEffect(() => onPaymentFlowChanged(setPaymentActive), []);

  useEffect(() => {
    if (!Updates.isEnabled) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || Date.now() - lastCheck.current < CHECK_EVERY_MS) return;
      lastCheck.current = Date.now();
      // A failed check (offline, server busy) is fine: the next one, or the next launch, will try again.
      void Updates.checkForUpdateAsync()
        .then((result) => (result.isAvailable ? Updates.fetchUpdateAsync() : undefined))
        .catch(() => undefined);
    });
    return () => subscription.remove();
  }, []);

  if (!Updates.isEnabled || !isUpdatePending || dismissed || paymentActive) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-50 items-center px-4"
      style={{ top: insets.top + 8 }}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="w-full max-w-md flex-row items-center gap-3 rounded-2xl bg-white p-3.5"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 }}
      >
        <View className="min-w-0 flex-1">
          <Text className="text-[14px] font-black text-[#0A0A0A]">A new version is ready</Text>
          <Text className="mt-0.5 text-[12px] text-[#77777E]">Restart Hook to get the latest improvements.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setDismissed(true)} className="h-10 justify-center px-2">
          <Text className="text-[13px] font-semibold text-[#77777E]">Later</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={restarting}
          onPress={() => {
            setRestarting(true);
            void Updates.reloadAsync().catch(() => setRestarting(false));
          }}
          className="h-10 items-center justify-center rounded-full bg-hook px-4 disabled:opacity-60"
        >
          <Text className="text-[13px] font-bold">{restarting ? "Restarting…" : "Restart"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
