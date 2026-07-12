import { Tabs } from 'expo-router';

import { HookTabBar } from '@/components/tab-bar/HookTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <HookTabBar {...props} />}
      screenOptions={{
        animation: 'none',
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="location" options={{ title: 'Location' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
