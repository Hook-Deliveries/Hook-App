import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastProvider } from '@/components/shared/toast';
import { AppQueryProvider } from '@/lib/query';

export const unstable_settings = {
  anchor: 'splash',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppQueryProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="auth/index" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth/guest-mode"
            options={{ gestureEnabled: false, headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen name="auth/password" options={{ headerShown: false }} />
          <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="auth/reset-code" options={{ gestureEnabled: false, headerShown: false }} />
          <Stack.Screen name="auth/create-new-password" options={{ gestureEnabled: false, headerShown: false }} />
          <Stack.Screen name="auth/create-password" options={{ headerShown: false }} />
          <Stack.Screen name="auth/verify-email" options={{ gestureEnabled: false, headerShown: false }} />
          <Stack.Screen name="auth/enter-name" options={{ gestureEnabled: false, headerShown: false }} />
          <Stack.Screen
            name="auth/congratulations"
            options={{ gestureEnabled: false, headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              fullScreenGestureEnabled: false,
              gestureEnabled: false,
              headerShown: false,
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
        <ToastProvider />
      </ThemeProvider>
    </AppQueryProvider>
  );
}
