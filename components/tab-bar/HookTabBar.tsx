import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Record<string, { label: string; active: IconName; inactive: IconName }> = {
  index: { label: 'Home', active: 'home', inactive: 'home-outline' },
  location: { label: 'Discover', active: 'compass', inactive: 'compass-outline' },
  scan: { label: 'Scan', active: 'scan', inactive: 'scan-outline' },
  orders: { label: 'Orders', active: 'cube', inactive: 'cube-outline' },
  profile: { label: 'Profile', active: 'person', inactive: 'person-outline' },
};

const spring = { damping: 20, stiffness: 220, mass: 0.65 };

export function HookTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const slotWidth = width > 0 ? width / state.routes.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (slotWidth > 0) translateX.value = withSpring(state.index * slotWidth, spring);
  }, [slotWidth, state.index, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  function measure(event: LayoutChangeEvent) { setWidth(event.nativeEvent.layout.width); }

  return (
    <SafeAreaView edges={['bottom']} className="bg-white" style={styles.shadow}>
      <View accessibilityRole="tablist" onLayout={measure} className="relative h-[68px] flex-row border-t border-black/5 bg-white pt-2">
        {slotWidth > 0 ? <Animated.View pointerEvents="none" style={[styles.indicatorTrack, { width: slotWidth }, indicatorStyle]}><View style={{ width: slotWidth * 0.38 }} className="h-[3px] rounded-full bg-hook" /></Animated.View> : null}
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          const tab = TABS[route.name] || { label: options.title || route.name, active: 'ellipse', inactive: 'ellipse-outline' };
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              void Haptics.selectionAsync();
              navigation.navigate(route.name, route.params);
            }
          };
          return <TabButton key={route.key} focused={focused} label={tab.label} activeIcon={tab.active} inactiveIcon={tab.inactive} accessibilityLabel={options.tabBarAccessibilityLabel || tab.label} onPress={onPress} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} />;
        })}
      </View>
    </SafeAreaView>
  );
}

function TabButton({ focused, label, activeIcon, inactiveIcon, accessibilityLabel, onPress, onLongPress }: { focused: boolean; label: string; activeIcon: IconName; inactiveIcon: IconName; accessibilityLabel: string; onPress: () => void; onLongPress: () => void }) {
  const progress = useSharedValue(focused ? 1 : 0);
  useEffect(() => { progress.value = withSpring(focused ? 1 : 0, spring); }, [focused, progress]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['rgba(255,200,9,0)', 'rgba(255,200,9,0.14)']),
    transform: [{ scale: 1 + progress.value * 0.05 }],
  }));
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={accessibilityLabel} onPress={onPress} onLongPress={onLongPress} className="flex-1 items-center justify-center" style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}><Animated.View style={style} className="items-center justify-center rounded-xl px-3 py-1"><Ionicons name={focused ? activeIcon : inactiveIcon} size={22} color={focused ? '#111111' : '#8E8E93'} /><Text numberOfLines={1} className={`mt-0.5 text-[10px] font-semibold ${focused ? 'text-black' : 'text-[#8E8E93]'}`}>{label}</Text></Animated.View></Pressable>;
}

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 12 },
  indicatorTrack: { position: 'absolute', left: 0, top: 0, alignItems: 'center' },
});
