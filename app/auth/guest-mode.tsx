import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import passwordIcon from '@/assets/images/auth/password.png';
import { AuthGlowBackground } from '@/components/shared/glow-background';
import { toast } from '@/components/shared/toast';
import { registerPushToken } from '@/lib/push';
import { ensureGuestId } from '@/lib/session';

export default function GuestModeScreen() {
  const insets = useSafeAreaInsets();

  async function continueAsGuest() {
    await ensureGuestId();
    await registerPushToken();
    toast.success('Guest mode enabled', 'You can create an account anytime.');
    router.replace('/(tabs)');
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <AuthGlowBackground />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-4" style={{ paddingTop: insets.top }}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="h-[49px] w-[49px] items-center justify-center rounded-[24.5px] border border-white/35 bg-white/[0.18]"
            style={{
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
            }}
            onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#000" />
          </Pressable>
        </View>

        <View className="flex-1 px-4 pb-4 pt-[45px]">
          <Image source={passwordIcon} resizeMode="contain" style={{ height: 49, width: 49 }} />

          <View className="mt-[34px] gap-1.5">
            <Text className="text-[28px] font-bold leading-9 text-black">Continue as guest</Text>
            <Text className="text-base leading-[22px] text-hook-text">
              Shop now without creating an account. Hook will keep your activity on this device until you decide to sign in.
            </Text>
          </View>

          <View className="mt-[34px] gap-3 rounded-[24px] bg-white/92 p-4">
            <GuestPoint icon="cart-outline" title="Cart stays with you" text="Items you add are saved to this guest session." />
            <GuestPoint icon="sparkles-outline" title="Negotiate prices" text="You can still use Hook's negotiation flow while browsing." />
            <GuestPoint icon="receipt-outline" title="Checkout as guest" text="Use your delivery details when you are ready to place an order." />
            <GuestPoint icon="person-add-outline" title="Upgrade anytime" text="Create an account later and Hook will merge your guest activity." />
          </View>

          <View className="mt-5">
            <Pressable
              accessibilityRole="button"
              className="h-[52px] items-center justify-center rounded-full bg-hook"
              onPress={continueAsGuest}>
              <Text className="text-sm font-semibold text-black">Continue as guest</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="mt-3 h-[52px] items-center justify-center rounded-full bg-white/85"
              onPress={() => router.back()}>
              <Text className="text-sm font-semibold text-black">Back to sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function GuestPoint({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-hook-surface">
        <Ionicons name={icon} size={18} color="#111111" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-black">{title}</Text>
        <Text className="mt-0.5 text-sm leading-5 text-hook-text">{text}</Text>
      </View>
    </View>
  );
}
