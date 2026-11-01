import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNetworkState } from "@/lib/network-status";

/**
 * Passive notice for a Hook-side outage. It never takes touches, never blocks the app, and
 * disappears on its own once Hook answers again. Skipped while the device is offline so it
 * never stacks with NetworkBanner.
 */
export function ConnectionBanner({ visible }: { visible: boolean }) {
  const insets = useSafeAreaInsets();
  const network = useNetworkState();
  if (!visible || network !== "online") return null;
  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeInUp.duration(260)}
      exiting={FadeOutUp.duration(220)}
      style={{ position: "absolute", left: 0, right: 0, top: insets.top + 6, zIndex: 9998, alignItems: "center" }}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          backgroundColor: "#1F1F23",
          paddingHorizontal: 14,
          paddingVertical: 8,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Ionicons name="sync-outline" size={15} color="#FFC809" />
        <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: "NunitoSans-Bold" }}>
          Reconnecting to Hook…
        </Text>
      </View>
    </Animated.View>
  );
}
