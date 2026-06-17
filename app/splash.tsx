import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable
      className="flex-1 items-center justify-center bg-hook"
      onPress={() => router.replace('/onboarding')}>
      <StatusBar style="light" />
      <View className="h-full w-full items-center justify-center">
        <Text className="text-[55px] font-bold leading-[66px] text-hook-surface">Hook</Text>
      </View>
    </Pressable>
  );
}
