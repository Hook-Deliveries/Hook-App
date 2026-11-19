import { View } from "react-native";

import { HookLoader } from "@/components/shared/HookLoader";

type HookRefreshIndicatorProps = {
  visible: boolean;
  top: number;
};

export function HookRefreshIndicator({
  visible,
  top,
}: HookRefreshIndicatorProps) {
  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        zIndex: 100,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 20,
          backgroundColor: "#FFFFFF",
          shadowColor: "#111111",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.14,
          shadowRadius: 8,
        }}
      >
        <HookLoader size="inline" variant="dark" />
      </View>
    </View>
  );
}
