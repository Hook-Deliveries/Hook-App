import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

import { Text, TextInput } from "react-native";
import { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ToastProvider } from "@/components/shared/toast";
import { AppQueryProvider } from "@/lib/query";
import { HookLocationProvider } from "@/lib/location-context";

export const unstable_settings = {
  anchor: "splash",
};

void SplashScreen.preventAutoHideAsync();

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
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const isMarketHero = pathname.includes("/markets/");
  const [fontsLoaded, fontError] = useFonts({
    "NunitoSans-Regular": require("@expo-google-fonts/nunito-sans/400Regular/NunitoSans_400Regular.ttf"),
    "NunitoSans-Medium": require("@expo-google-fonts/nunito-sans/500Medium/NunitoSans_500Medium.ttf"),
    "NunitoSans-SemiBold": require("@expo-google-fonts/nunito-sans/600SemiBold/NunitoSans_600SemiBold.ttf"),
    "NunitoSans-Bold": require("@expo-google-fonts/nunito-sans/700Bold/NunitoSans_700Bold.ttf"),
    "NunitoSans-ExtraBold": require("@expo-google-fonts/nunito-sans/800ExtraBold/NunitoSans_800ExtraBold.ttf"),
    "NunitoSans-Black": require("@expo-google-fonts/nunito-sans/900Black/NunitoSans_900Black.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;
  if (fontsLoaded) applyNunitoDefaults();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppQueryProvider>
        <HookLocationProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen
                name="index"
                options={{ gestureEnabled: false, headerShown: false }}
              />
              <Stack.Screen
                name="splash"
                options={{ gestureEnabled: false, headerShown: false }}
              />
              <Stack.Screen
                name="onboarding"
                options={{
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
                  presentation: "modal",
                  title: "Notification",
                  headerStyle: { backgroundColor: "#f1f1f3" },
                  headerShadowVisible: false,
                  headerTintColor: "#111",
                  headerTitleStyle: {
                    color: "#000",
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
                name="(app)/addresses/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(app)/likes"
                options={{ headerShown: false }}
              />
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
                name="(app)/shop/[categoryId]"
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
                name="auth/guest-mode"
                options={{
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
            <StatusBar
              animated
              backgroundColor={isMarketHero ? "#111111" : "#F1F1F3"}
              style={isMarketHero ? "light" : "dark"}
              translucent={false}
            />
            <ToastProvider />
          </ThemeProvider>
        </HookLocationProvider>
      </AppQueryProvider>
    </GestureHandlerRootView>
  );
}
