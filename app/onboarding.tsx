import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, NextButton, PaginationDots, SkipButton } from '@/components/features/onboarding/controls';
import { DESIGN_WIDTH, ONBOARDING_SLIDES } from '@/components/features/onboarding/data';
import { OnboardingVisual } from '@/components/features/onboarding/visuals';

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = width / DESIGN_WIDTH;
  const activeSlide = ONBOARDING_SLIDES[activeIndex];
  const topY = Math.max(insets.top + 8, 44 * scale);

  const goNext = () => {
    if (activeIndex === ONBOARDING_SLIDES.length - 1) {
      router.replace('/auth');
      return;
    }

    setActiveIndex((index) => index + 1);
  };

  return (
    <View className="flex-1 overflow-hidden bg-hook-surface">
      <StatusBar style="dark" />

      <OnboardingVisual activeIndex={activeIndex} scale={scale} />

      <SkipButton scale={scale} top={topY} onPress={() => router.replace('/auth')} />
      {activeIndex > 0 && (
        <BackButton
          scale={scale}
          top={topY}
          onPress={() => setActiveIndex((index) => index - 1)}
        />
      )}

      <PaginationDots activeIndex={activeIndex} scale={scale} />

      <View
        className="absolute"
        style={{ left: 16 * scale, top: 602 * scale, width: 288 * scale }}>
        <Text
          style={{
            color: '#000',
            fontSize: 32 * scale,
            fontWeight: '700',
            lineHeight: 38 * scale,
          }}>
          {activeSlide.title}
        </Text>
        <Text
          style={{
            color: '#414040',
            fontSize: 16 * scale,
            fontWeight: '500',
            lineHeight: 20 * scale,
            marginTop: 6 * scale,
          }}>
          {activeSlide.description}
        </Text>
      </View>

      <NextButton
        scale={scale}
        top={770 * scale}
        isLast={activeIndex === ONBOARDING_SLIDES.length - 1}
        onPress={goNext}
      />
    </View>
  );
}
