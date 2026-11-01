import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HookLoader } from "@/components/shared/HookLoader";
import { HookPageHeader } from "@/components/shared/HookPageHeader";

export type PaymentStage = "creating" | "redirecting" | "confirming";

const STAGE_COPY: Record<PaymentStage, { title: string; body: string }> = {
  creating: {
    title: "Setting up your order",
    body: "We're reserving your items and preparing secure payment.",
  },
  redirecting: {
    title: "Complete your payment",
    body: "Finish in the secure window, then come back here.",
  },
  confirming: {
    title: "Confirming your payment",
    body: "This usually takes a few seconds. Please keep this screen open.",
  },
};

const STEPS: { key: PaymentStage; label: string }[] = [
  { key: "creating", label: "Order created" },
  { key: "redirecting", label: "Payment authorised" },
  { key: "confirming", label: "Payment confirmed" },
];

/** Shown from checkout submission until the order screen takes over, so the empty-cart guard doesn't flash first. */
export function PaymentProcessingScreen({ stage }: { stage: PaymentStage }) {
  const insets = useSafeAreaInsets();
  const activeIndex = STEPS.findIndex((step) => step.key === stage);
  const copy = STAGE_COPY[stage];

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F1F3", paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
        <HookPageHeader title="Checkout" centered />
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
        <View style={{ borderRadius: 22, backgroundColor: "white", padding: 20 }}>
          <View style={{ alignItems: "flex-start" }}>
            <HookLoader />
          </View>
          <Text accessibilityRole="header" style={{ marginTop: 16, fontSize: 18, lineHeight: 24, color: "#111", fontFamily: "NunitoSans-Black" }}>
            {copy.title}
          </Text>
          <Text accessibilityLiveRegion="polite" style={{ marginTop: 4, fontSize: 13, lineHeight: 19, color: "#77777B" }}>
            {copy.body}
          </Text>

          <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: "#F0F0F2", paddingTop: 16, gap: 14 }}>
            {STEPS.map((step, index) => {
              const done = index < activeIndex;
              const active = index === activeIndex;
              return (
                <View key={step.key} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: done || active ? "#FFC809" : "#EDEDEF",
                    }}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={13} color="#111" />
                    ) : (
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: active ? "#111" : "#B5B5B8" }} />
                    )}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: done || active ? "#111" : "#9A9A9E",
                      fontFamily: done || active ? "NunitoSans-Bold" : "NunitoSans-Regular",
                    }}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 16, backgroundColor: "#FFF9E5", paddingHorizontal: 14, paddingVertical: 12 }}>
          <Ionicons name="shield-checkmark-outline" size={17} color="#8A6500" />
          <Text style={{ flex: 1, fontSize: 12, lineHeight: 17, color: "#6F5900" }}>
            Your money is protected by Hook until you receive your order.
          </Text>
        </View>
      </View>
    </View>
  );
}
