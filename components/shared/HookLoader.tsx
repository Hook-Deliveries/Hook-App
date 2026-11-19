import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedProps, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

type HookLoaderProps = {
  label?: string;
  size?: 'page' | 'inline' | 'button';
  variant?: 'yellow' | 'dark';
  className?: string;
};

const HOOK_YELLOW = '#FFC809';
const HOOK_YELLOW_ON_LIGHT = '#E0AE00';
const HOOK_DARK = '#111111';

/** Same three sizes the web loader uses, so the app and the websites feel like one product. */
const ORB_SIZE = { button: 18, inline: 26, page: 44 } as const;

/**
 * Hook's one loading indicator: the "working" thinking orb, a sphere of dots that turns while a ring of
 * light runs down it. This is a React Native port of the `working` state from @yogesharc/thinking-orbs
 * (MIT, https://thinkingorbs.com), which the web apps already use. That library draws through the DOM, so
 * it cannot run in React Native; the motion math here is the same, drawn with react-native-svg and driven
 * on the UI thread by Reanimated, so a busy JS thread never makes it stutter.
 */

const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** The orb's tuned values for the working state, at any size. */
const PERIOD_MS = 3000; // one full turn
const TILT = (20 * Math.PI) / 180; // seen from slightly above
const RING_EVERY_MS = 1700; // a ring of light starts this often
const RING_RUN_MS = 1200; // and takes this long to run down the sphere
const DENSITY = 4; // dots per px of size

/** The ring's axis in view space: tipped 30° toward you, then rolled 10° so its right end rides higher. */
const RING_AXIS = (() => {
  const tip = (30 * Math.PI) / 180;
  const roll = (10 * Math.PI) / 180;
  return [-Math.sin(roll) * Math.cos(tip), Math.cos(roll) * Math.cos(tip), Math.sin(tip)] as const;
})();

type Dot = { x: number; y: number; z: number };
type Geometry = { c: number; R: number; rs: number; st: number; ct: number };

/** Dots on a unit sphere along a Fibonacci spiral, so they spread evenly with no clumps at the poles. */
function distribute(count: number): Dot[] {
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const theta = i * GOLDEN;
    return { x: r * Math.cos(theta), y, z: r * Math.sin(theta) };
  });
}

function geometryFor(size: number): Geometry {
  const c = size / 2;
  return {
    c,
    R: c * 0.8,
    // Dots shrink as they multiply, so the sphere's coverage stays steady at every size.
    rs: (size / 64) ** 0.6 * (0.72 * Math.sqrt(4 / DENSITY)),
    st: Math.sin(TILT),
    ct: Math.cos(TILT),
  };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type OrbDotProps = { dot: Dot; time: { value: number }; geo: Geometry; color: string };

const OrbDot = memo(function OrbDot({ dot, time, geo, color }: OrbDotProps) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const t = time.value;
    const { c, R, rs, st, ct } = geo;

    // Turn the sphere, then tip it toward the viewer.
    const yaw = (t / PERIOD_MS) * TAU;
    const sy = Math.sin(yaw);
    const cy = Math.cos(yaw);
    const z1 = -dot.x * sy + dot.z * cy;
    let vx = dot.x * cy + dot.z * sy;
    let vy = dot.y * ct - z1 * st;
    const vz = dot.y * st + z1 * ct;

    // Nearer dots are bigger and brighter; the back fades out from just behind the rim, leaving no haze.
    const d = (vz + 1) / 2;
    let r = (0.5 + 1.4 * d) * rs;
    let a = Math.max(0, (d - 0.3) / 0.7);

    // Every 1.7s a ring of light runs down the sphere over 1.2s, through the back as well as the front.
    // What it has passed pulls in and shrinks, then lets go.
    const u = t % RING_EVERY_MS;
    const run = Math.min(1, u / RING_RUN_MS);
    const at = 1.3 - 2.6 * ((1 - Math.cos(Math.PI * run)) / 2);
    const q = vx * RING_AXIS[0] + vy * RING_AXIS[1] + vz * RING_AXIS[2];
    const g = u < RING_RUN_MS ? Math.exp(-(((q - at) / 0.2) ** 2)) : 0;
    r *= 1 + 0.6 * g;
    a += (1 - a) * g;
    const release = u < RING_RUN_MS ? 1 : 1 - Math.min(1, 1.6 * ((u - RING_RUN_MS) / 800));
    const w = Math.min(1, Math.max(0, (q - at) / 0.2)) * release;
    vx *= 1 - 0.08 * w;
    vy *= 1 - 0.08 * w;
    r *= 1 - 0.15 * w;

    return {
      cx: c + vx * R,
      cy: c - vy * R,
      // No dot drops below 0.45px, or it renders as a grey haze.
      r: Math.max(0.45, r),
      fillOpacity: a,
    };
  });

  return <AnimatedCircle animatedProps={animatedProps} cx={geo.c} cy={geo.c} r={0} fill={color} fillOpacity={0} />;
});

function Orb({ size, color }: { size: number; color: string }) {
  const reducedMotion = useReducedMotion();
  const time = useSharedValue(0);
  const geo = useMemo(() => geometryFor(size), [size]);
  const dots = useMemo(() => distribute(Math.max(8, Math.round(size * DENSITY))), [size]);

  // A frame's gap is capped at 100ms, so a screen coming back from the background carries on instead of jumping.
  // With reduced motion the orb holds still on its first frame.
  useFrameCallback((frame) => {
    'worklet';
    if (frame.timeSincePreviousFrame != null) time.value += Math.min(frame.timeSincePreviousFrame, 100);
  }, !reducedMotion);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {dots.map((dot, index) => (
        <OrbDot key={index} dot={dot} time={time} geo={geo} color={color} />
      ))}
    </Svg>
  );
}

export function HookLoader({ label, size = 'inline', variant, className }: HookLoaderProps) {
  const isButton = size === 'button';
  const tone = variant || (isButton ? 'dark' : 'yellow');
  // Gold reads on a dark button, but needs a slightly deeper gold on a light page.
  const color = tone === 'dark' ? HOOK_DARK : isButton ? HOOK_YELLOW : HOOK_YELLOW_ON_LIGHT;

  return (
    <View className={className} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        accessibilityRole={label ? 'progressbar' : undefined}
        accessibilityLabel={label || 'Loading'}
        accessible
        importantForAccessibility="yes"
      >
        <Orb size={ORB_SIZE[size]} color={color} />
      </View>
      {label && !isButton ? (
        <Text
          style={{
            color: '#696969',
            fontSize: 13,
            fontWeight: '600',
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}
