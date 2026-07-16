import LottieView from 'lottie-react-native';
import { Text, View } from 'react-native';

interface LottieLoaderProps {
  label?: string;
  size?: number;
  className?: string;
}

// Central loading animation source — used anywhere the app needs a richer
// loading state than the inline HookLoader progress bar (bottom sheets, full-screen waits).
const LOADING_ANIMATION_SOURCE = { uri: 'https://lottie.host/8d1057e4-025a-45a8-956e-f5f2f05c9ca9/ygaVkE9Bis.json' };

export function LottieLoader({ label, size = 96, className }: LottieLoaderProps) {
  return (
    <View className={`items-center justify-center ${className ?? ''}`}>
      <LottieView
        source={LOADING_ANIMATION_SOURCE}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
      {label ? <Text className="-mt-2 text-sm font-medium text-hook-text">{label}</Text> : null}
    </View>
  );
}
