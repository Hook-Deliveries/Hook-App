import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

type HookLoaderProps = {
  label?: string;
  size?: 'page' | 'inline' | 'button';
  variant?: 'yellow' | 'dark';
  className?: string;
};

const HOOK_YELLOW = '#FFC809';
const HOOK_DARK = '#111111';

export function HookLoader({ label, size = 'inline', variant, className }: HookLoaderProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const isButton = size === 'button';
  const tone = variant || (isButton ? 'dark' : 'yellow');
  const activeColor = tone === 'dark' ? HOOK_DARK : HOOK_YELLOW;
  const width = isButton ? 56 : 120;
  const height = isButton ? 12 : 22;
  const borderWidth = isButton ? 1.5 : 2;
  const inset = isButton ? 1.5 : 2;
  const thumbWidth = width * 0.25;
  const travel = width - thumbWidth - inset * 4;
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, travel, 0],
  });

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        duration: 1000,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  return (
    <View className={className} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        accessibilityRole={label ? 'progressbar' : undefined}
        style={{
          borderColor: activeColor,
          borderRadius: 40,
          borderWidth,
          height,
          overflow: 'hidden',
          position: 'relative',
          width,
        }}>
        <Animated.View
          style={{
            backgroundColor: activeColor,
            borderRadius: 40,
            bottom: inset,
            left: inset,
            position: 'absolute',
            top: inset,
            transform: [{ translateX }],
            width: thumbWidth,
          }}
        />
      </View>
      {label && !isButton ? (
        <Text style={{ color: '#696969', fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
