import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";

import { refreshSession } from "@/lib/api";
import { getPendingSignup, getSession } from "@/lib/session";

const SPLASH_DELAY = 900;

export default function SplashScreen() {
  const routed = useRef(false);

  useEffect(() => {
    let mounted = true;

    function replace(path: Parameters<typeof router.replace>[0]) {
      if (!mounted || routed.current) return;
      routed.current = true;
      router.replace(path);
    }

    async function route() {
      await new Promise((resolve) => setTimeout(resolve, SPLASH_DELAY));
      if (!mounted) return;

      const session = await getSession();
      if (session && (await refreshSession(session))) {
        replace("/(tabs)");
        return;
      }

      const pendingSignup = await getPendingSignup();
      if (pendingSignup) {
        replace({
          pathname:
            pendingSignup.step === "complete_profile"
              ? "/auth/enter-name"
              : "/auth/verify-email",
          params: { email: pendingSignup.email },
        });
        return;
      }

      replace("/(tabs)");
    }

    void route();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-hook px-6">
      <StatusBar style="light" />
      <View className="w-full flex-1 items-center justify-center">
        <Text className="text-[55px] font-bold leading-[66px] text-black">
          hook
          <Text className="text-[55px] font-bold leading-[66px] text-white">
            .
          </Text>
        </Text>
      </View>
      <View className="w-full items-center pb-8">
        <View className="mb-3 h-px w-8 bg-black/20" />
        <Text className="text-center text-[11px] font-bold uppercase tracking-[1.6px] text-black/60">
          Velaris Technologies Limited
        </Text>
      </View>
    </View>
  );
}
