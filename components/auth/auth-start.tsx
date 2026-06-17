import { AntDesign, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import authStartGif from '@/assets/images/onboarding/auth-start.gif';
import { Button } from '@/components/ui/button';

type SignUpMode = 'phone' | 'email';
type DeliveryMode = 'sms' | 'whatsapp';

export function AuthStart() {
  const [signUpMode, setSignUpMode] = useState<SignUpMode>('phone');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('whatsapp');

  return (
    <View className="flex-1 bg-hook">
      <View className="h-[319px] w-full overflow-hidden">
        <Image
          source={authStartGif}
          contentFit="cover"
          style={{ width: '100%', height: 319 }}
        />
      </View>

      <View className="flex-1 -mt-3 rounded-t-[20px] bg-hook-surface overflow-hidden">
        <View className="flex-1 px-[15px] pt-11">
          {/* Heading */}
          <View className="gap-1.5">
            <Text className="text-[28px] font-bold leading-9 text-black">Get started</Text>
            <Text className="text-base text-hook-text">
              {signUpMode === 'phone'
                ? 'It takes less than 1 min to complete'
                : 'It takes less than 3 min to complete'}
            </Text>
          </View>

          <View className="mt-9 rounded-[20px] bg-white p-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-hook-text">Sign up with</Text>
              <View className="flex-row gap-3">
                <SegmentButton
                  active={signUpMode === 'phone'}
                  label="Phone No"
                  onPress={() => setSignUpMode('phone')}
                />
                <SegmentButton
                  active={signUpMode === 'email'}
                  label="E-mail"
                  onPress={() => setSignUpMode('email')}
                />
              </View>
            </View>

            {signUpMode === 'phone' ? (
              <>
                <PhoneField />
                <View className="mt-5 flex-row gap-3">
                  <PillChoice
                    active={deliveryMode === 'sms'}
                    label="SMS"
                    onPress={() => setDeliveryMode('sms')}
                  />
                  <PillChoice
                    active={deliveryMode === 'whatsapp'}
                    label="WhatsApp"
                    onPress={() => setDeliveryMode('whatsapp')}
                  />
                </View>
              </>
            ) : (
              <>
                <EmailField />
                <Pressable
                  accessibilityRole="button"
                  className="mt-5 h-[52px] items-center justify-center rounded-full bg-hook">
                  <Text className="text-base text-black">Continue</Text>
                </Pressable>
              </>
            )}
          </View>

          <View className="mt-9 flex-row items-center gap-5">
            <View className="h-px flex-1 bg-black/20" />
            <Text className="text-sm text-hook-text">Or with</Text>
            <View className="h-px flex-1 bg-black/20" />
          </View>

          <View className="mt-9 flex-row justify-center gap-3.5">
            <SocialButton accessibilityLabel="Continue with Google">
              <AntDesign name="google" size={21}  />
            </SocialButton>
            <SocialButton accessibilityLabel="Continue with Apple">
              <Ionicons name="logo-apple" size={24} color="#000" />
            </SocialButton>
            <SocialButton accessibilityLabel="Continue with Facebook">
              <FontAwesome5 name="facebook" size={23} color="#1877f2" />
            </SocialButton>
          </View>
        </View>
      </View>
    </View>
  );
}

function SegmentButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`h-[33px] w-[92px] items-center justify-center rounded-full ${
        active ? 'bg-hook' : 'bg-hook-surface'
      }`}
      onPress={onPress}>
      <Text className="text-sm text-black">{label}</Text>
    </Pressable>
  );
}

function NigeriaFlag() {
  // Nigeria flag: green | white | green
  return (
    <View className="h-[30px] w-[30px] overflow-hidden rounded-full flex-row">
      <View style={{ flex: 1, backgroundColor: '#008751' }} />
      <View style={{ flex: 1, backgroundColor: '#fff' }} />
      <View style={{ flex: 1, backgroundColor: '#008751' }} />
    </View>
  );
}

function PhoneField() {
  return (
    <View className="mt-5 h-[52px] flex-row overflow-hidden rounded-full bg-hook-surface">
      {/* Country code pill */}
      <View className="h-[52px] w-[91px] flex-row items-center gap-1.5 rounded-full border border-white px-1.5">
        <NigeriaFlag />
        <Text className="text-sm font-medium text-black">+234</Text>
      </View>
      <TextInput
        className="h-[52px] flex-1 px-3 text-sm text-black"
        keyboardType="phone-pad"
        placeholder="Phone number"
        placeholderTextColor="rgba(0,0,0,0.51)"
      />
    </View>
  );
}

function EmailField() {
  return (
    <TextInput
      autoCapitalize="none"
      className="mt-5 h-[52px] rounded-full bg-hook-surface px-5 text-sm text-black"
      keyboardType="email-address"
      placeholder="hook@gmail.com"
      placeholderTextColor="rgba(0,0,0,0.51)"
    />
  );
}

function PillChoice({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Button
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`h-[52px] flex-1 rounded-full ${active ? 'bg-hook' : 'bg-hook-surface'}`}
      labelClassName="text-base text-black"
      title={label}
      variant="ghost"
      onPress={onPress}
    />
  );
}

function SocialButton({
  accessibilityLabel,
  children,
}: {
  accessibilityLabel: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-full bg-white">
      {children}
    </Pressable>
  );
}
