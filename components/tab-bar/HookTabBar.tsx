import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { memo, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  ReduceMotion,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type TabMetadata = {
  label: string;
  icon: IconName;
};

const TAB_METADATA: Record<string, TabMetadata> = {
  index: { label: 'Home', icon: 'home-variant' },
  location: { label: 'Location', icon: 'magnify' },
  scan: { label: 'Scan', icon: 'line-scan' },
  orders: { label: 'Orders', icon: 'cube' },
  profile: { label: 'Profile', icon: 'account' },
};

const COLORS = {
  screenBackground: '#F4F4F4',
  tabBar: '#FFFFFF',
  activeIcon: '#FFC400',
  inactiveIcon: '#A9A9A9',
  activeLabel: '#1F1F1F',
  inactiveLabel: '#AEAEAE',
  border: 'rgba(0, 0, 0, 0.035)',
};

const BAR_TOP = 12;
const BAR_BODY_HEIGHT = 70;
const CANVAS_HEIGHT = BAR_TOP + BAR_BODY_HEIGHT;
const FLOATING_BUTTON_SIZE = 46;
const ICON_SIZE = 20;
const EDGE_PADDING = 20;
const NOTCH_HALF_WIDTH = 36;
const NOTCH_DEPTH = 35;
const CORNER_RADIUS = 4;

const POSITION_SPRING = {
  stiffness: 280,
  damping: 17,
  mass: 0.9,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
  reduceMotion: ReduceMotion.System,
} as const;

function getTabMetadata(routeName: string): TabMetadata {
  return TAB_METADATA[routeName] ?? { label: routeName, icon: 'circle' };
}

function calculateTabCenter(position: number, width: number, tabCount: number): number {
  'worklet';

  if (width <= 0 || tabCount <= 0) {
    return Math.max(width / 2, 0);
  }

  const usableWidth = Math.max(width - EDGE_PADDING * 2, 1);
  const tabWidth = usableWidth / tabCount;
  const center = EDGE_PADDING + tabWidth * position + tabWidth / 2;
  const minCenter = FLOATING_BUTTON_SIZE / 2;
  const maxCenter = width - FLOATING_BUTTON_SIZE / 2;

  if (maxCenter <= minCenter) {
    return width / 2;
  }

  return Math.min(Math.max(center, minCenter), maxCenter);
}

function createTabBarPath(width: number, height: number, centerX: number): string {
  'worklet';

  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, CANVAS_HEIGHT);
  const top = BAR_TOP;
  const bottom = safeHeight;
  const notchStart = Math.max(centerX - NOTCH_HALF_WIDTH, CORNER_RADIUS);
  const notchEnd = Math.min(centerX + NOTCH_HALF_WIDTH, safeWidth - CORNER_RADIUS);

  return `
    M ${CORNER_RADIUS} ${top}
    H ${notchStart}
    C ${centerX - 30} ${top}
      ${centerX - 34} ${top + 8}
      ${centerX - 28} ${top + 15}
    C ${centerX - 21} ${top + 27}
      ${centerX - 14} ${top + NOTCH_DEPTH}
      ${centerX} ${top + NOTCH_DEPTH}
    C ${centerX + 14} ${top + NOTCH_DEPTH}
      ${centerX + 21} ${top + 27}
      ${centerX + 28} ${top + 15}
    C ${centerX + 34} ${top + 8}
      ${centerX + 30} ${top}
      ${notchEnd} ${top}
    H ${safeWidth - CORNER_RADIUS}
    Q ${safeWidth} ${top}
      ${safeWidth} ${top + CORNER_RADIUS}
    V ${bottom - CORNER_RADIUS}
    Q ${safeWidth} ${bottom}
      ${safeWidth - CORNER_RADIUS} ${bottom}
    H ${CORNER_RADIUS}
    Q 0 ${bottom}
      0 ${bottom - CORNER_RADIUS}
    V ${top + CORNER_RADIUS}
    Q 0 ${top}
      ${CORNER_RADIUS} ${top}
    Z
  `;
}

type TabBarSurfaceProps = {
  width: number;
  height: number;
  tabCount: number;
  position: SharedValue<number>;
};

const TabBarSurface = memo(function TabBarSurface({ width, height, tabCount, position }: TabBarSurfaceProps) {
  const animatedPathProps = useAnimatedProps(() => {
    const centerX = calculateTabCenter(position.value, width, tabCount);
    return { d: createTabBarPath(width, height, centerX) };
  });

  if (width <= 0 || tabCount <= 0) {
    return null;
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <AnimatedPath
        animatedProps={animatedPathProps}
        fill={COLORS.tabBar}
        stroke={COLORS.border}
        strokeWidth={1}
      />
    </Svg>
  );
});

type IndicatorIconProps = {
  icon: IconName;
  position: SharedValue<number>;
  fromIndex: SharedValue<number>;
  toIndex: SharedValue<number>;
  type: 'previous' | 'next';
};

const IndicatorIcon = memo(function IndicatorIcon({ icon, position, fromIndex, toIndex, type }: IndicatorIconProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.max(Math.abs(toIndex.value - fromIndex.value), 1);
    const progress = Math.min(Math.abs(position.value - fromIndex.value) / distance, 1);
    const opacity = type === 'previous'
      ? interpolate(progress, [0, 0.45], [1, 0], Extrapolation.CLAMP)
      : interpolate(progress, [0.2, 0.65], [0, 1], Extrapolation.CLAMP);
    const scale = type === 'previous'
      ? interpolate(progress, [0, 0.45], [1, 0.9], Extrapolation.CLAMP)
      : interpolate(progress, [0.2, 0.65], [0.9, 1], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.indicatorIconContainer, animatedStyle]}>
      <MaterialCommunityIcons name={icon} size={ICON_SIZE} color={COLORS.activeIcon} />
    </Animated.View>
  );
});

type AnimatedTabButtonProps = {
  routeName: string;
  index: number;
  isFocused: boolean;
  slotWidth: number;
  position: SharedValue<number>;
  accessibilityLabel: string;
  testID?: string;
  onPress: () => void;
  onLongPress: () => void;
};

const AnimatedTabButton = memo(function AnimatedTabButton({
  routeName,
  index,
  isFocused,
  slotWidth,
  position,
  accessibilityLabel,
  testID,
  onPress,
  onLongPress,
}: AnimatedTabButtonProps) {
  const metadata = getTabMetadata(routeName);
  const labelWidth = Math.max(Math.min(slotWidth - 4, 68), 46);

  const baseIconStyle = useAnimatedStyle(() => {
    const distance = Math.abs(position.value - index);

    return {
      opacity: interpolate(distance, [0, 0.32, 0.72], [0, 0, 1], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(distance, [0, 0.72], [0.92, 1], Extrapolation.CLAMP) }],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const distance = Math.abs(position.value - index);
    const selectedAmount = interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP);

    return {
      color: interpolateColor(selectedAmount, [0, 1], [COLORS.inactiveLabel, COLORS.activeLabel]),
      transform: [{ translateY: interpolate(selectedAmount, [0, 1], [0, 1], Extrapolation.CLAMP) }],
    };
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={isFocused ? { selected: true } : {}}
      testID={testID}
      hitSlop={6}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.tabButton, pressed && styles.tabButtonPressed]}>
      <Animated.View style={[styles.baseIcon, baseIconStyle]}>
        <MaterialCommunityIcons name={metadata.icon} size={ICON_SIZE} color={COLORS.inactiveIcon} />
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.tabLabel, { width: labelWidth }, isFocused && styles.focusedTabLabel, labelStyle]}>
        {metadata.label}
      </Animated.Text>
    </Pressable>
  );
});

export function HookTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const position = useSharedValue(state.index);
  const fromIndex = useSharedValue(state.index);
  const toIndex = useSharedValue(state.index);
  const indicatorScale = useSharedValue(1);
  const previousIndexRef = useRef(state.index);
  const [iconPair, setIconPair] = useState({ previous: state.index, next: state.index });

  useEffect(() => {
    if (previousIndexRef.current === state.index) return;

    const previous = previousIndexRef.current;
    fromIndex.value = position.value;
    toIndex.value = state.index;
    setIconPair({ previous, next: state.index });
    position.value = withSpring(state.index, POSITION_SPRING);
    previousIndexRef.current = state.index;
  }, [fromIndex, position, state.index, toIndex]);

  function moveIndicator(previous: number, next: number) {
    fromIndex.value = position.value;
    toIndex.value = next;
    setIconPair({ previous, next });
    position.value = withSpring(next, POSITION_SPRING);
    previousIndexRef.current = next;
  }

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth <= 0) return;
    setWidth((current) => (Math.abs(current - nextWidth) < 0.5 ? current : nextWidth));
  }

  const indicatorStyle = useAnimatedStyle(() => {
    const centerX = calculateTabCenter(position.value, width, state.routes.length);

    return {
      transform: [
        { translateX: centerX - FLOATING_BUTTON_SIZE / 2 },
        { scale: indicatorScale.value },
      ],
    };
  });

  function playIndicatorPressAnimation() {
    indicatorScale.value = withSequence(
      withSpring(0.96, { stiffness: 420, damping: 25, mass: 0.6 }),
      withSpring(1, { stiffness: 330, damping: 21, mass: 0.7 }),
    );
  }

  const bottomSpacing = insets.bottom;
  const tabBarHeight = CANVAS_HEIGHT + bottomSpacing;
  const tabSlotWidth = width > 0 && state.routes.length > 0
    ? Math.max((width - EDGE_PADDING * 2) / state.routes.length, 1)
    : 64;
  const previousRoute = state.routes[iconPair.previous] ?? state.routes[state.index];
  const nextRoute = state.routes[iconPair.next] ?? state.routes[state.index];
  const previousIcon = getTabMetadata(previousRoute?.name ?? 'index').icon;
  const nextIcon = getTabMetadata(nextRoute?.name ?? 'index').icon;

  return (
    <View style={[styles.safeAreaContainer, { height: tabBarHeight }]}>
      <View accessibilityRole="tablist" onLayout={handleLayout} style={[styles.canvas, { height: tabBarHeight }]}>
        {width > 0 && state.routes.length > 0 ? (
          <>
            <TabBarSurface width={width} height={tabBarHeight} tabCount={state.routes.length} position={position} />
            <Animated.View pointerEvents="none" style={[styles.floatingButton, indicatorStyle]}>
              {iconPair.previous === iconPair.next ? (
                <View style={styles.indicatorIconContainer}>
                  <MaterialCommunityIcons name={nextIcon} size={ICON_SIZE} color={COLORS.activeIcon} />
                </View>
              ) : (
                <>
                  <IndicatorIcon icon={previousIcon} position={position} fromIndex={fromIndex} toIndex={toIndex} type="previous" />
                  <IndicatorIcon icon={nextIcon} position={position} fromIndex={fromIndex} toIndex={toIndex} type="next" />
                </>
              )}
            </Animated.View>
          </>
        ) : (
          <View style={styles.fallbackSurface} />
        )}

        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const options = descriptors[route.key].options;
            const isFocused = state.index === index;
            const metadata = getTabMetadata(route.name);
            const accessibilityLabel = options.tabBarAccessibilityLabel ?? metadata.label;

            function handlePress() {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                playIndicatorPressAnimation();
                moveIndicator(state.index, index);
                void Haptics.selectionAsync();
                navigation.navigate(route.name, route.params);
              } else if (isFocused && !event.defaultPrevented) {
                playIndicatorPressAnimation();
                void Haptics.selectionAsync();
              }
            }

            function handleLongPress() {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            }

            return (
              <AnimatedTabButton
                key={route.key}
                routeName={route.name}
                index={index}
                isFocused={isFocused}
                slotWidth={tabSlotWidth}
                position={position}
                accessibilityLabel={accessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={handlePress}
                onLongPress={handleLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    backgroundColor: COLORS.screenBackground,
    alignItems: 'center',
  },
  canvas: {
    height: CANVAS_HEIGHT,
    width: '100%',
    overflow: 'visible',
  },
  fallbackSurface: {
    ...StyleSheet.absoluteFillObject,
    top: BAR_TOP,
    backgroundColor: COLORS.tabBar,
    borderTopLeftRadius: CORNER_RADIUS,
    borderTopRightRadius: CORNER_RADIUS,
  },
  tabsRow: {
    position: 'absolute',
    top: 43,
    left: EDGE_PADDING,
    right: EDGE_PADDING,
    height: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  tabButtonPressed: {
    opacity: 0.82,
  },
  baseIcon: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  focusedTabLabel: {
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    backgroundColor: COLORS.tabBar,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 5,
  },
  indicatorIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
