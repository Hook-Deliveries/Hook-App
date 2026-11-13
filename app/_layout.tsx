import { NetworkBanner } from "@/components/shared/NetworkBanner";
import { DefaultTheme, Stack, ThemeProvider, usePathname } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as LocalAuthentication from "expo-local-authentication";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import "../global.css";

import { AppState, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { ToastProvider } from "@/components/shared/toast";
import { AppQueryProvider } from "@/lib/query";
import { HookLocationProvider } from "@/lib/location-context";
import { AuthSheetProvider } from "@/components/auth/AuthSheetProvider";
import { getBiometricEnabled, getSession } from "@/lib/session";
import { checkHookHealth } from "@/lib/health";
import { ConnectionBanner } from "@/components/shared/ConnectionBanner";
import { ReplacementFab } from "@/components/shared/ReplacementFab";

export const unstable_settings = { anchor: "(tabs)" };

function applyNunitoDefaults() {
  const TextWithDefaults = Text as typeof Text & {
    defaultProps?: Record<string, unknown>;
  };
  const InputWithDefaults = TextInput as typeof TextInput & {
    defaultProps?: Record<string, unknown>;
  };
  TextWithDefaults.defaultProps = {
    ...TextWithDefaults.defaultProps,
    style: [
      { fontFamily: "NunitoSans-Regular" },
      TextWithDefaults.defaultProps?.style,
    ],
  };
  InputWithDefaults.defaultProps = {
    ...InputWithDefaults.defaultProps,
    style: [
      { fontFamily: "NunitoSans-Regular" },
      InputWithDefaults.defaultProps?.style,
    ],
  };
}

export default function RootLayout() {
  const pathname = usePathname();
  // The Home tab resolves to "/", so only the real splash route may bypass outage gating.
  const isLaunchSplash = pathname === "/splash";
  const isMarketHero = pathname.includes("/markets/");
  const isMainTab = ['/', '/discover', '/offers', '/profile'].includes(pathname);
  // Shown on every screen except Profile (its own approval banner already covers this) and an order's own detail page (where the approval card it points to is already on screen).
  const hideReplacementFab = pathname === '/profile' || (pathname.startsWith('/orders/') && pathname !== '/orders');
  const safeAreaBackground = isMainTab ? '#F1F1F3' : '#FFFFFF';
  // Every route fills the window; footers reserve their own safe area instead of shrinking the navigator.
  const isFullBleedRoute = isLaunchSplash || pathname === "/onboarding";
  const [fontsLoaded] = useFonts({
    "NunitoSans-Regular": require("@expo-google-fonts/nunito-sans/400Regular/NunitoSans_400Regular.ttf"),
    "NunitoSans-Medium": require("@expo-google-fonts/nunito-sans/500Medium/NunitoSans_500Medium.ttf"),
    "NunitoSans-SemiBold": require("@expo-google-fonts/nunito-sans/600SemiBold/NunitoSans_600SemiBold.ttf"),
    "NunitoSans-Bold": require("@expo-google-fonts/nunito-sans/700Bold/NunitoSans_700Bold.ttf"),
    "NunitoSans-ExtraBold": require("@expo-google-fonts/nunito-sans/800ExtraBold/NunitoSans_800ExtraBold.ttf"),
    "NunitoSans-Black": require("@expo-google-fonts/nunito-sans/900Black/NunitoSans_900Black.ttf"),
  });
  const [launchReady, setLaunchReady] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!fontsLoaded) return;
    let active = true;
    void (async () => {
      const [session, biometric, healthy] = await Promise.all([
        getSession(),
        getBiometricEnabled(),
        checkHookHealth(),
      ]);
      if (session && biometric) {
        await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock Hook",
          fallbackLabel: "Use device passcode",
          disableDeviceFallback: false,
        });
      }
      if (active) {
        setBackendAvailable(healthy);
        setLaunchReady(true);
      }
    })();
    return () => { active = false; };
  }, [fontsLoaded]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      // Best-effort fallback only: the auth session that opened this redirect already closes
      // itself on the matching URL, so dismissBrowser() usually has nothing left to dismiss
      // and throws — never let that surface to the user.
      if (url.startsWith("hook://payments/return")) {
        WebBrowser.dismissBrowser().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!launchReady) return;
    let active = true;
    const verify = async () => {
      const healthy = await checkHookHealth();
      if (active) setBackendAvailable(healthy);
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void verify();
    });
    const intervalMs = backendAvailable === false ? 5_000 : 60_000;
    const interval = setInterval(() => {
      if (AppState.currentState === "active") void verify();
    }, intervalMs);
    return () => {
      active = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, [backendAvailable, launchReady]);

  if (fontsLoaded) applyNunitoDefaults();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: safeAreaBackground }}>
        <BottomSheetModalProvider>
        <KeyboardProvider>
        <SafeAreaView
          edges={[]}
          style={{ flex: 1, backgroundColor: safeAreaBackground }}
        >
          <View style={{ flex: 1, backgroundColor: isFullBleedRoute ? "transparent" : "#F1F1F3" }}>
            <AppQueryProvider>
              <HookLocationProvider>
                <AuthSheetProvider>
                  {/* Hook's UI is light-only, so the nav theme is pinned rather than following the device. */}
                  <ThemeProvider value={DefaultTheme}>
            <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 260 }}>
              <Stack.Screen
                name="splash"
                options={{
                  animation: "none",
                  gestureEnabled: false,
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="index"
                options={{ gestureEnabled: false, headerShown: false }}
              />
              <Stack.Screen
                name="onboarding"
                options={{
                  presentation: "card",
                  animation: "slide_from_bottom",
                  gestureDirection: "vertical",
                  fullScreenGestureEnabled: false,
                  gestureEnabled: false,
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(app)/notifications/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/notifications/[id]"
                options={{
                  headerShown: true,
                  presentation: "modal",
                  title: "Notification",
                  headerStyle: { backgroundColor: "#f1f1f3" },
                  headerShadowVisible: false,
                  headerTintColor: "#111",
                  headerTitleStyle: {
                    color: "#000",
                    fontFamily: "NunitoSans-Bold",
                    fontSize: 18,
                    fontWeight: "700",
                  },
                }}
              />
              <Stack.Screen
                name="(app)/checkout"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/cart/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/orders/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/orders/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/orders/receipt/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/payments/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/addresses/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/likes"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(app)/profile/edit" options={{ headerShown: false }} />
              <Stack.Screen name="(app)/profile/security" options={{ headerShown: false }} />
              <Stack.Screen name="(app)/profile/devices" options={{ headerShown: false }} />
              <Stack.Screen name="(app)/profile/notifications" options={{ headerShown: false }} />
              <Stack.Screen
                name="(app)/states"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="(app)/markets/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/products/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/negotiations/new"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/shop/[categoryId]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/legal/[type]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/index"
                options={{
                  fullScreenGestureEnabled: false,
                  gestureEnabled: false,
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="auth/password"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/forgot-password"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/reset-code"
                options={{ gestureEnabled: false, headerShown: false }}
              />
              <Stack.Screen
                name="auth/create-new-password"
                options={{ gestureEnabled: false, headerShown: false }}
              />
              <Stack.Screen
                name="auth/create-password"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/verify-email"
                options={{ gestureEnabled: false, headerShown: false }}
              />
              <Stack.Screen
                name="auth/enter-name"
                options={{ gestureEnabled: false, headerShown: false }}
              />
              <Stack.Screen
                name="auth/congratulations"
                options={{
                  gestureEnabled: false,
                  headerShown: false,
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  fullScreenGestureEnabled: false,
                  gestureEnabled: false,
                  headerShown: false,
                }}
              />
            </Stack>
            <NetworkBanner />
            <ConnectionBanner visible={backendAvailable === false} />
            <ReplacementFab hidden={hideReplacementFab} />
            <StatusBar animated style={isMarketHero ? "light" : "dark"} />
            <ToastProvider />
                  </ThemeProvider>
                </AuthSheetProvider>
              </HookLocationProvider>
            </AppQueryProvider>
          </View>
        </SafeAreaView>
        </KeyboardProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
