import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthGlowBackground } from "@/components/shared/glow-background";
import { AuthBackButton } from "@/components/auth/auth-screen-shell";
import { HookLoader } from "@/components/shared/HookLoader";
import { toast } from "@/components/shared/toast";
import { registerPushToken } from "@/lib/push";
import { ensureGuestId } from "@/lib/session";

const GUEST_BENEFITS = [
  {
    icon: "bag-handle-outline",
    title: "Keep your shopping activity",
    text: "Your basket and browsing session stay connected to this device.",
  },
  {
    icon: "sparkles-outline",
    title: "Explore Hook prices",
    text: "Browse markets, discover products, and negotiate where available.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Private and temporary",
    text: "You decide when to create an account and transfer your activity.",
  },
] as const;

export default function GuestModeScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  async function continueAsGuest() {
    if (loading) return;
    setLoading(true);
    try {
      await ensureGuestId();
      await registerPushToken().catch(() => null);
      toast.success(
        "Guest mode ready",
        "Your guest session is saved on this device.",
      );
      router.replace("/(tabs)");
    } catch (error) {
      toast.error(
        "Could not start guest mode",
        error instanceof Error
          ? error.message
          : "Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <AuthGlowBackground />

      <View className="px-5" style={{ paddingTop: insets.top + 8 }}>
        <AuthBackButton onPress={() => router.back()} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="flex-1 px-5 pt-10">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/70">
            <Ionicons name="person-outline" size={28} color="#111111" />
          </View>

          <Text className="mt-7 text-[30px] font-bold leading-9 text-black">
            Shop as a guest
          </Text>
          <Text className="mt-2 text-base leading-6 text-hook-text">
            Start exploring without creating an account. Hook securely remembers
            this guest session on your device.
          </Text>

          <View className="mt-8 overflow-hidden rounded-[22px] border border-black/5 bg-white/90 px-4">
            {GUEST_BENEFITS.map((benefit, index) => (
              <GuestBenefit
                key={benefit.title}
                {...benefit}
                last={index === GUEST_BENEFITS.length - 1}
              />
            ))}
          </View>

          <View className="mt-auto pt-8">
            <Pressable
              accessibilityRole="button"
              className={`h-[54px] items-center justify-center rounded-full bg-hook ${loading ? "opacity-70" : ""}`}
              disabled={loading}
              onPress={continueAsGuest}
            >
              {loading ? (
                <HookLoader size="button" variant="dark" />
              ) : (
                <Text className="text-[15px] font-semibold text-black">
                  Continue as guest
                </Text>
              )}
            </Pressable>
            <Text className="mt-3 px-4 text-center text-xs leading-5 text-hook-muted">
              Checkout may require contact and delivery information. You can
              create an account at any time.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function GuestBenefit({
  icon,
  last,
  text,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  last: boolean;
  text: string;
  title: string;
}) {
  return (
    <View
      className={`flex-row gap-3 py-4 ${last ? "" : "border-b border-black/5"}`}
    >
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hook/20">
        <Ionicons name={icon} size={19} color="#111111" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-semibold text-black">{title}</Text>
        <Text className="mt-1 text-sm leading-5 text-hook-text">{text}</Text>
      </View>
    </View>
  );
}
