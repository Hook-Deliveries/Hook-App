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
import { HookLoader } from '@/components/shared/HookLoader';
import { toast } from '@/components/shared/toast';
import { useLookupEmailMutation } from '@/lib/auth-api';
import { useHookGoogleAuth } from '@/lib/google-auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthStart() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const lookupEmail = useLookupEmailMutation();
  const { isGoogleLoading, isGoogleReady, signInWithGoogle } = useHookGoogleAuth();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const loading = lookupEmail.isPending;

  function handleFocus() {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 180, animated: true }), 100);
  }

  function handleApplePress() {
    toast.info('Coming soon', '👀 Stay tuned');
  }

  async function handleContinue() {
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    try {
      const result = await lookupEmail.mutateAsync(trimmed);
      if (result.nextStep === 'password') {
        router.push({ pathname: '/auth/password', params: { email: trimmed } });
        return;
      }
      if (result.nextStep === 'verify_email') {
        toast.info('Continue signup', 'Create your password again to resend your code.');
        router.push({ pathname: '/auth/create-password', params: { email: trimmed } });
        return;
      }
      if (result.nextStep === 'complete_profile') {
        toast.info('Continue signup', 'Create your password again to finish securely.');
        router.push({ pathname: '/auth/create-password', params: { email: trimmed } });
        return;
      }
      router.push({ pathname: '/auth/create-password', params: { email: trimmed } });
    } catch (error) {
      toast.error('Could not continue', error instanceof Error ? error.message : 'Please try again.');
    }
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
          <View className="relative h-[319px] w-full overflow-hidden bg-hook">
            <Image
              source={authStartGif}
              contentFit="cover"
              style={{ width: '100%', height: 319 }}
            />
            <Pressable
              accessibilityRole="button"
              className="absolute right-4 top-14 rounded-full border border-black/10 bg-white/25 px-4 py-2"
              onPress={() => router.push('/auth/guest-mode')}>
              <Text className="text-sm font-semibold text-black">Skip for now</Text>
            </Pressable>
          </View>

          {/* Sheet */}
          <View className="-mt-3 rounded-t-[20px] bg-hook-surface px-[18px] pb-10 pt-11">
            {/* Heading */}
            <View className="gap-1.5">
              <Text className="text-[28px] font-bold leading-9 text-black">Welcome to Hook</Text>
              <Text className="text-base text-hook-text">Enter your email to sign in or create an account</Text>
            </View>

            {/* Input card */}
            <View className="mt-9 rounded-[20px] bg-white p-3.5">
              {/* E-mail pill label */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-hook-text">Continue with</Text>
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
                disabled={loading}
                onPress={handleContinue}>
                {loading ? <HookLoader size="button" variant="dark" /> : <Text className="text-base font-medium text-black">Continue</Text>}
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              className="mt-4 items-center self-center px-5 py-2"
              onPress={() => router.push({ pathname: '/auth/forgot-password', params: { email: email.trim() } })}>
              <Text className="text-sm font-medium text-black">Forgot password?</Text>
            </Pressable>

            {/* Divider */}
            <View className="mt-5 flex-row items-center gap-5">
              <View className="h-px flex-1 bg-black/20" />
              <Text className="text-sm text-hook-text">Or with</Text>
              <View className="h-px flex-1 bg-black/20" />
            </View>

            {/* Social buttons */}
            <View className="mt-9 flex-row justify-center gap-3.5">
              <SocialButton
                accessibilityLabel="Continue with Google"
                disabled={!isGoogleReady || isGoogleLoading}
                onPress={signInWithGoogle}>
                {isGoogleLoading ? <HookLoader size="button" variant="yellow" /> : <AntDesign name="google" size={21} color="#4285f4" />}
              </SocialButton>
              <SocialButton accessibilityLabel="Continue with Apple" onPress={handleApplePress}>
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
  disabled,
  onPress,
}: {
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={`h-10 w-10 items-center justify-center rounded-full bg-white ${disabled ? 'opacity-60' : ''}`}
      disabled={disabled}
      onPress={onPress}>
      {children}
    </Pressable>
  );
}
