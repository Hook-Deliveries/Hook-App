import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';

export function SkipButton({
  onPress,
  scale,
  top,
}: {
  onPress: () => void;
  scale: number;
  top: number;
}) {
  return (
    <Button
      accessibilityLabel="Skip onboarding"
      accessibilityRole="button"
      className="absolute"
      size="auto"
      style={{
        height: 27.34 * scale,
        right: 24.5 * scale,
        shadowColor: 'rgba(0,0,0,0.25)',
        shadowOffset: { width: 0, height: 5.76 * scale },
        shadowOpacity: 1,
        shadowRadius: 5.76 * scale,
        top,
        width: 59 * scale,
      }}
      variant="blurredPill"
      onPress={onPress}>
      <Text style={{ color: '#000', fontSize: 14.39 * scale, fontWeight: '400' }}>
        Skip
      </Text>
    </Button>
  );
}

export function BackButton({
  onPress,
  scale,
  top,
}: {
  onPress: () => void;
  scale: number;
  top: number;
}) {
  return (
    <Button
      accessibilityLabel="Go back"
      accessibilityRole="button"
      className="absolute"
      size="auto"
      style={{
        height: 27.34 * scale,
        left: 24.5 * scale,
        shadowColor: 'rgba(0,0,0,0.25)',
        shadowOffset: { width: 0, height: 5.76 * scale },
        shadowOpacity: 1,
        shadowRadius: 5.76 * scale,
        top,
        width: 27.34 * scale,
      }}
      variant="blurredPill"
      onPress={onPress}>
      <Ionicons name="chevron-back" size={Math.round(16 * scale)} color="#000" />
    </Button>
  );
}

export function PaginationDots({
  activeIndex,
  scale,
}: {
  activeIndex: number;
  scale: number;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        left: 16 * scale,
        position: 'absolute',
        top: 565 * scale,
      }}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={{
            backgroundColor: index === activeIndex ? '#FFC809' : '#fff',
            borderRadius: 11 * scale,
            height: 11 * scale,
            width: (index === activeIndex ? 25 : 11) * scale,
          }}
        />
      ))}
    </View>
  );
}

export function NextButton({
  isLast,
  onPress,
  scale,
  top,
}: {
  isLast: boolean;
  onPress: () => void;
  scale: number;
  top: number;
}) {
  return (
    <Button
      accessibilityLabel={isLast ? 'Get started' : 'Next onboarding screen'}
      accessibilityRole="button"
      className="absolute flex-row rounded-full bg-white px-0"
      style={{ height: 54 * scale, left: 16 * scale, top, width: 370 * scale }}
      variant="ghost"
      onPress={onPress}>
      <View
        className="absolute items-center justify-center rounded-full bg-hook"
        style={{ height: 50 * scale, left: 2 * scale, width: 50 * scale }}>
        <Ionicons name="checkmark" size={Math.round(35 * scale)} color="black" />
      </View>

      <Text style={{ color: '#414040', fontSize: 16 * scale, fontWeight: '500' }}>
        {isLast ? 'Get Started' : 'Next'}
      </Text>

      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          position: 'absolute',
          right: 16 * scale,
        }}>
        <Ionicons name="chevron-forward" size={Math.round(25 * scale)} color="rgba(0,0,0,0.25)" />
        <Ionicons
          name="chevron-forward"
          size={Math.round(25 * scale)}
          color="rgba(0,0,0,0.5)"
          style={{ marginLeft: -13 * scale }}
        />
        <Ionicons
          name="chevron-forward"
          size={Math.round(25 * scale)}
          color="black"
          style={{ marginLeft: -13 * scale }}
        />
      </View>
    </Button>
  );
}
