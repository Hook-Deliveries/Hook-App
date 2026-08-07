import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { refreshSession } from "@/lib/api";
import {
  getPendingSignup,
  getSession,
  restoreGuestSession,
} from "@/lib/session";
import { HookLogo } from "@/components/shared/HookLogo";

export default function SplashScreen() {
  useEffect(() => {
    let mounted = true;

    async function route() {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const session = await getSession();
      if (session && (await refreshSession(session))) {
        if (mounted) router.replace("/(tabs)");
        return;
      }

      const guestSession = await restoreGuestSession();
      if (guestSession) {
        if (mounted) router.replace("/(tabs)");
        return;
      }

      const pendingSignup = await getPendingSignup();
      if (pendingSignup) {
        if (mounted) {
          router.replace({
            pathname:
              pendingSignup.step === "complete_profile"
                ? "/auth/enter-name"
                : "/auth/verify-email",
            params: { email: pendingSignup.email },
          });
        }
        return;
      }

      if (mounted) router.replace("/onboarding");
    }

    route();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Pressable
      className="flex-1 items-center justify-center bg-hook"
      onPress={() => router.replace("/onboarding")}
    >
      <View className="h-full w-full items-center justify-center">
        <HookLogo size="lg" markColor="#111111" />
      </View>
    </Pressable>
  );
}
