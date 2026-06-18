import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import authStartGif from '@/assets/images/onboarding/auth-start.gif';
import { toast } from '@/components/shared/toast';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthStart() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  function handleFocus() {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 180, animated: true }), 100);
  }

  function handleSocialPress() {
    toast.info('Coming soon', '👀 Stay tuned');
  }

  function handleContinue() {
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    router.push({ pathname: '/auth/create-password', params: { email: trimmed } });
  }

  return (
    <View className="flex-1 bg-hook-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          ref={scrollRef}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          {/* GIF hero on yellow bg */}
          <View className="h-[319px] w-full overflow-hidden bg-hook">
            <Image
              source={authStartGif}
              contentFit="cover"
              style={{ width: '100%', height: 319 }}
            />
          </View>

          {/* Sheet */}
          <View className="-mt-3 rounded-t-[20px] bg-hook-surface px-[18px] pb-10 pt-11">
            {/* Heading */}
            <View className="gap-1.5">
              <Text className="text-[28px] font-bold leading-9 text-black">Get started</Text>
              <Text className="text-base text-hook-text">It takes less than 1 min to complete</Text>
            </View>

            {/* Input card */}
            <View className="mt-9 rounded-[20px] bg-white p-3.5">
              {/* E-mail pill label */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-hook-text">Sign up with</Text>
                <View className="h-[33px] w-[92px] items-center justify-center rounded-full bg-hook">
                  <Text className="text-sm text-black">E-mail</Text>
                </View>
              </View>

              {/* Email input */}
              <TextInput
                ref={inputRef}
                autoCapitalize="none"
                autoCorrect={true}
                className={`mt-5 h-[52px] rounded-full bg-hook-surface px-5 text-sm text-black border-[1.5px] ${
                  emailError ? 'border-[#ef4444]' : 'border-transparent'
                }`}
                keyboardType="email-address"
                placeholder="hook@gmail.com"
                placeholderTextColor="rgba(0,0,0,0.51)"
                returnKeyType="done"
                value={email}
                onChangeText={(v) => { setEmail(v); setEmailError(false); }}
                onFocus={handleFocus}
                onSubmitEditing={handleContinue}
              />
              {emailError && (
                <Text className="ml-4 mt-1.5 text-sm text-[#ef4444]">
                  Please enter a valid email address
                </Text>
              )}

              {/* Continue */}
              <Pressable
                accessibilityRole="button"
                className="mt-5 h-[52px] items-center justify-center rounded-full bg-hook"
                onPress={handleContinue}>
                <Text className="text-base font-medium text-black">Continue</Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View className="mt-9 flex-row items-center gap-5">
              <View className="h-px flex-1 bg-black/20" />
              <Text className="text-sm text-hook-text">Or with</Text>
              <View className="h-px flex-1 bg-black/20" />
            </View>

            {/* Social buttons */}
            <View className="mt-9 flex-row justify-center gap-3.5">
              <SocialButton accessibilityLabel="Continue with Google" onPress={handleSocialPress}>
                <AntDesign name="google" size={21} color="#4285f4" />
              </SocialButton>
              <SocialButton accessibilityLabel="Continue with Apple" onPress={handleSocialPress}>
                <Ionicons name="logo-apple" size={24} color="#000" />
              </SocialButton>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SocialButton({
  accessibilityLabel,
  children,
  onPress,
}: {
  accessibilityLabel: string;
  children: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-full bg-white"
      onPress={onPress}>
      {children}
    </Pressable>
  );
}
