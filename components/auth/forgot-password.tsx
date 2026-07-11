import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AuthPrimaryButton, AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { toast } from '@/components/shared/toast';
import { useForgotPasswordMutation } from '@/lib/auth-api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPassword() {
  const { email: initialEmail = '' } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(false);
  const forgotPassword = useForgotPasswordMutation();
  const trimmed = email.trim();
  const isValid = EMAIL_REGEX.test(trimmed);
  const loading = forgotPassword.isPending;

  async function handleContinue() {
    setTouched(true);
    if (!isValid) return;
    try {
      await forgotPassword.mutateAsync(trimmed);
      toast.success('Verification code sent', 'Check your email for the reset code.');
      router.push({ pathname: '/auth/reset-code', params: { email: trimmed } });
    } catch (error) {
      toast.error('Could not send code', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <AuthScreenShell
      title="Reset password"
      description="Enter the email address associated with your account and we'll send you a verification code">
      <View className="gap-3">
        <View
          className={`h-[50px] flex-row items-center rounded-full border-[1.3px] bg-white px-4 ${
            touched && !isValid ? 'border-[#ef4444]' : 'border-[#90a1b9]'
          }`}>
          <Ionicons name="mail" size={18} color="#8b8b8b" />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="ml-3 flex-1 text-sm text-black"
            keyboardType="email-address"
            placeholder="Enter your email"
            placeholderTextColor="rgba(0,0,0,0.35)"
            returnKeyType="done"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (touched) setTouched(false);
            }}
            onSubmitEditing={handleContinue}
          />
        </View>

        <AuthPrimaryButton
          disabled={!isValid || loading}
          loading={loading}
          label="Send verification code"
          onPress={handleContinue}
        />
      </View>
    </AuthScreenShell>
  );
}
