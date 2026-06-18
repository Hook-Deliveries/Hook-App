import { LinearGradient } from 'expo-linear-gradient';
import { View, useWindowDimensions } from 'react-native';

// A yellow-tinted radial-style glow background used across onboarding and auth screens.
// Mount as the first child of a relative/absolute container.

function BackgroundEllipse({ left, top, scale }: { left: number; top: number; scale: number }) {
  const size = 720 * scale;
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['#FFC809', 'rgba(241,241,243,0.02)']}
      locations={[0, 1]}
      className="absolute rounded-full"
      style={{ height: size, left: left * scale, top: top * scale, width: size }}
    />
  );
}

function TopGlow({ scale }: { scale: number }) {
  return (
    <>
      <BackgroundEllipse left={-111} top={-111} scale={scale} />
      <BackgroundEllipse left={-204} top={520} scale={scale} />
    </>
  );
}

function FadeOverlay() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['transparent', 'rgba(255,199,0,0.12)', 'rgba(241,241,243,0.70)', '#f1f1f3']}
      locations={[0, 0.32, 0.64, 0.86]}
      className="absolute left-0 right-0"
      style={{ height: '44%', top: '36%' }}
    />
  );
}

function BottomHaze() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['transparent', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.65)']}
      locations={[0, 0.58, 1]}
      className="absolute bottom-0 left-0 right-0 h-[18%]"
    />
  );
}

export function GlowBackground() {
  const { width } = useWindowDimensions();
  const scale = width / 402;

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <LinearGradient
        pointerEvents="none"
        colors={['#B5FFFC', '#FFDEE9']}
        className="absolute left-0 top-0 h-[120%] w-full"
      />
      <TopGlow scale={scale} />
      <FadeOverlay />
      <BottomHaze />
    </View>
  );
}

// Full-screen yellow→white gradient used on auth screens (create-password, etc.)
export function AuthGlowBackground() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['#FFC809', '#ffffff']}
      locations={[0, 0.337]}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
