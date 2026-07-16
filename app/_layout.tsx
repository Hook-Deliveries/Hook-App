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
          <Stack.Screen name="index" options={{ gestureEnabled: false, headerShown: false }} />
          <Stack.Screen name="splash" options={{ gestureEnabled: false, headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ fullScreenGestureEnabled: false, gestureEnabled: false, headerShown: false }} />
          <Stack.Screen name="(app)/notifications/index" options={{ headerShown: false }} />
          <Stack.Screen
            name="(app)/notifications/[id]"
            options={{
              presentation: 'modal',
              title: 'Notification',
              headerStyle: { backgroundColor: '#f1f1f3' },
              headerShadowVisible: false,
              headerTintColor: '#111',
              headerTitleStyle: { color: '#000', fontSize: 18, fontWeight: '700' },
            }}
          />
          <Stack.Screen name="(app)/vendor/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/booths/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/booths/[id]/products/[productId]" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/checkout" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/cart/index" options={{ headerShown: false }} />
          <Stack.Screen name="auth/index" options={{ fullScreenGestureEnabled: false, gestureEnabled: false, headerShown: false }} />
          <Stack.Screen
            name="auth/guest-mode"
            options={{
              gestureEnabled: false,
              presentation: 'modal',
              title: '',
              headerTransparent: true,
              headerShadowVisible: false,
              headerTintColor: '#000',
            }}
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
