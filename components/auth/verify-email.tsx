import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import chatIcon from '@/assets/images/auth/chat-icon.png';

const CORRECT_CODE = '1234';
const RESEND_SECONDS = 28;

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}**@${domain}`;
}

export function VerifyEmail({ email }: { email: string }) {
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const refs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Countdown timer
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function handleDigit(index: number, value: string) {
    const char = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setStatus('idle');

    if (char && index < 3) {
      refs[index + 1].current?.focus();
    }

    // Auto-verify when all 4 filled
    if (char && index === 3) {
      const code = [...next.slice(0, 3), char].join('');
      verify(code, next);
    } else if (char) {
      const code = next.join('');
      if (code.length === 4) verify(code, next);
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  }

  function verify(code: string, currentDigits: string[]) {
    if (code === CORRECT_CODE) {
      setStatus('success');
      router.push({ pathname: '/auth/enter-name', params: { email } });
    } else if (currentDigits.every((d) => d !== '')) {
      setStatus('error');
    }
  }

  function handleResend() {
    if (seconds > 0) return;
    setDigits(['', '', '', '']);
    setStatus('idle');
    setSeconds(RESEND_SECONDS);
    refs[0].current?.focus();
  }

  const dotColor =
    status === 'error'
      ? 'rgba(255,89,0,0.33)'
      : status === 'success'
        ? 'rgba(0,255,77,0.42)'
        : 'rgba(255,200,9,0.2)';

  const borderColor = status === 'error' ? '#ef4444' : '#373737';

  return (
    <View className="flex-1 bg-hook-surface">
      {/* Back button */}
      <View className="px-4" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-[49px] w-[49px] items-center justify-center rounded-[24.5px] border border-white/35 bg-white/[0.18]"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#000" />
        </Pressable>
      </View>

      <View className="px-4 pt-[45px]">
        {/* Icon + progress dots */}
        <Image source={chatIcon} resizeMode="contain" style={{ width: 49, height: 48 }} />
        <View className="mt-[19px] flex-row gap-[9px]">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                backgroundColor: dotColor,
                borderRadius: 10,
                height: 8,
                width: 25,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 2,
              }}
            />
          ))}
        </View>

        {/* Heading */}
        <View className="mt-[34px] gap-1.5">
          <Text className="text-[28px] font-bold text-black">Verify E-mail</Text>
          <Text className="text-base text-hook-text">
            Insert the 4-digit code that we sent to {maskEmail(email)}
          </Text>
        </View>

        {/* OTP boxes */}
        <View className="mt-[34px] gap-3">
          <View className="flex-row gap-[9px]">
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={refs[i]}
                className="h-[50px] w-[50px] rounded-[6.6px] text-center text-base font-medium text-black"
                style={{ borderWidth: 1.3, borderColor }}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(v) => handleDigit(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                selectTextOnFocus
              />
            ))}
          </View>

          {status === 'error' && (
            <Text className="text-sm text-[#ef4444]">Invalid code. Please try again.</Text>
          )}

          <Pressable onPress={handleResend} disabled={seconds > 0}>
            <Text className={`text-sm ${seconds > 0 ? 'text-hook-text' : 'text-black font-medium'}`}>
              {seconds > 0
                ? `Resend code in 00:${String(seconds).padStart(2, '0')}`
                : 'Resend code'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
