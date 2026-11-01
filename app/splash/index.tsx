import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { checkHookHealth } from "@/lib/health";
import { resumeSession as refreshSession } from "@/lib/api";
import { getOnboardingComplete, getPendingSignup, getSession } from "@/lib/session";

const IS_WEB = Platform.OS === "web";
const SPLASH_DELAY = IS_WEB ? 0 : 900;

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const routed = useRef(false);

  useEffect(() => {
    let mounted = true;

    function replace(path: Parameters<typeof router.replace>[0]) {
      if (!mounted || routed.current) return;
      routed.current = true;
      router.replace(path);
    }

    async function route() {
      const [, healthy] = await Promise.all([
        new Promise((resolve) => setTimeout(resolve, SPLASH_DELAY)),
        checkHookHealth(),
      ]);
      if (!mounted) return;

      // An unreachable backend must not trap the user here: the root layout shows a passive
      // banner and keeps retrying, so launch routing falls back to what is stored on the device.
      const session = await getSession();
      if (session && (!healthy || (await refreshSession(session)))) {
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

      if (!(await getOnboardingComplete())) {
        replace("/onboarding");
        return;
      }

      replace("/(tabs)");
    }

    void route();

    return () => {
      mounted = false;
    };
  }, []);

  if (IS_WEB) return null;

  // The wordmark sits at the exact centre of the screen, where the native launch image draws it, so
  // the hand-off from the native splash is invisible. The footer is pinned and takes no part in centring.
  return (
    <View className="flex-1 items-center justify-center bg-hook px-6">
      <StatusBar style="light" />
      <Text className="text-[55px] font-bold leading-[66px] text-black">
        hook
        <Text className="text-[55px] font-bold leading-[66px] text-white">.</Text>
      </Text>
      <View
        className="items-center"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <View className="mb-3 h-px w-8 bg-black/20" />
        <Text className="text-center text-[11px] font-bold uppercase tracking-[1.6px] text-black/60">
          Velaris Technologies Limited
        </Text>
      </View>
    </View>
  );
}
