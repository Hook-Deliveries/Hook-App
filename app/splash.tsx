import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { refreshSession } from "@/lib/api";
import { getPendingSignup, getSession } from "@/lib/session";

export default function SplashScreen() {
  useEffect(() => {
    let mounted = true;

    async function route() {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const session = await getSession();
      if (session && await refreshSession(session)) {
        if (mounted) router.replace("/(tabs)");
        return;
      }

      const pendingSignup = await getPendingSignup();
      if (pendingSignup) {
        if (mounted) {
          router.replace({
            pathname: pendingSignup.step === 'complete_profile' ? '/auth/enter-name' : '/auth/verify-email',
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
      <StatusBar style="light" />
      <View className="h-full w-full items-center justify-center">
        <Text className="text-[55px] font-bold leading-[66px] text-black">
          Hook
          <Text className="text-[55px] font-bold leading-[66px] text-white">
            .
          </Text>
        </Text>
      </View>
    </Pressable>
  );
}
