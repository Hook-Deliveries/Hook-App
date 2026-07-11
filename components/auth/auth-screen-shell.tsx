import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import passwordIcon from '@/assets/images/auth/password.png';
import { AuthGlowBackground } from '@/components/shared/glow-background';
import { HookLoader } from '@/components/shared/HookLoader';

export function AuthScreenShell({
  children,
  description,
  footer,
  icon = passwordIcon,
  title,
}: {
  children: ReactNode;
  description: ReactNode;
  footer?: ReactNode;
  icon?: number;
  title: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      <AuthGlowBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          <View className="px-4" style={{ paddingTop: insets.top + 8 }}>
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
            <Image source={icon} resizeMode="contain" style={{ height: 49, width: 49 }} />

            <View className="mt-[34px] gap-1.5">
              <Text className="text-[28px] font-bold leading-9 text-black">{title}</Text>
              <Text className="text-base leading-[22px] text-hook-text">{description}</Text>
            </View>

            <View className="mt-[34px]">{children}</View>
          </View>

          {footer ? (
            <View className="px-4" style={{ paddingBottom: insets.bottom + 20 }}>
              {footer}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function AuthPrimaryButton({
  disabled,
  label,
  loading,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      className={`h-[52px] items-center justify-center rounded-full ${
        isDisabled && !loading ? 'bg-[rgba(255,200,9,0.28)] opacity-60' : 'bg-hook opacity-100'
      }`}
      disabled={isDisabled}
      onPress={onPress}>
      {loading ? (
        <HookLoader size="button" variant="dark" />
      ) : (
        <Text className={`text-sm font-medium ${disabled ? 'text-black/35' : 'text-black'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
