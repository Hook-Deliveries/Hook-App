import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartButton } from '@/components/features/cart/CartButton';
import { ALL_STATES, StateDropdownSheet, type OperatingState } from '@/components/home/StateDropdownSheet';
import { HookLoader } from '@/components/shared/HookLoader';
import { RemoteImage } from '@/components/shared/RemoteImage';
import { SearchField } from '@/components/shared/SearchField';
import { useLocalSessionQuery } from '@/lib/auth-api';
import { useCategoriesQuery, useNotificationsQuery, useVendorsQuery } from '@/lib/mobile-api';

const STATE_KEY = 'hook.home.selectedState';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const session = useLocalSessionQuery();
  const [stateOpen, setStateOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<OperatingState>(ALL_STATES);
  const categoriesQuery = useCategoriesQuery();
  const vendorsQuery = useVendorsQuery(selectedState.code === ALL_STATES.code ? undefined : { stateCode: selectedState.code });
  const notifications = useNotificationsQuery();
  const categories = useMemo(() => (categoriesQuery.data as any[]) || [], [categoriesQuery.data]);
  const vendors = useMemo(() => ((vendorsQuery.data as any)?.data as any[]) || [], [vendorsQuery.data]);
  const firstName = session.data?.session?.user.firstName;
  const unread = Number((notifications.data as any)?.unread || 0);
  const refreshing = categoriesQuery.isRefetching || vendorsQuery.isRefetching;

  useEffect(() => { AsyncStorage.getItem(STATE_KEY).then((value) => { if (value) setSelectedState(JSON.parse(value)); }).catch(() => {}); }, []);
  const refresh = useCallback(() => { void categoriesQuery.refetch(); void vendorsQuery.refetch(); void notifications.refetch(); }, [categoriesQuery, notifications, vendorsQuery]);
  function chooseState(value: OperatingState) { setSelectedState(value); void AsyncStorage.setItem(STATE_KEY, JSON.stringify(value)); }

  return <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#111" />} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
      <View className="px-5 pb-5 pt-3">
        <View className="flex-row items-center justify-between"><View><Text className="text-sm font-semibold text-[#777]">{firstName ? `Welcome back, ${firstName}` : 'Welcome to Hook'}</Text><Text className="mt-0.5 text-[30px] font-black tracking-tight text-black">Marketplace</Text></View><View className="flex-row gap-2"><CartButton tone="white" /><Pressable accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} className="h-11 w-11 items-center justify-center rounded-full bg-white"><Ionicons name="notifications-outline" size={21} />{unread ? <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" /> : null}</Pressable></View></View>
        <View className="mt-5"><SearchField placeholder="Search products and markets" onPress={() => router.push('/(tabs)/location')} /></View>
        <Pressable onPress={() => setStateOpen(true)} className="mt-3 flex-row items-center self-start rounded-full bg-hook/20 px-3.5 py-2"><Ionicons name="location-outline" size={15} /><Text numberOfLines={1} className="ml-1.5 max-w-40 text-xs font-bold">{selectedState.name}</Text><Ionicons name="chevron-down" size={13} className="ml-1" /></Pressable>
      </View>

      <SectionTitle title="Shop by category" action="See all" onPress={() => router.push('/(tabs)/location')} />
      {categoriesQuery.isLoading ? <View className="h-28 items-center justify-center"><HookLoader size="inline" /></View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}><Pressable onPress={() => router.push('/(tabs)/scan')} className="w-[82px] items-center"><View className="h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-hook"><Ionicons name="scan" size={27} /></View><Text numberOfLines={1} className="mt-2 text-xs font-bold">Scan booth</Text></Pressable>{categories.map((category) => <Pressable key={category.id} onPress={() => router.push({ pathname: '/(tabs)/location', params: { categoryId: category.id } } as never)} className="w-[82px] items-center"><View className="relative h-[72px] w-[72px] overflow-hidden rounded-[22px] bg-white"><RemoteImage uri={category.iconUrl} fallbackIcon="pricetag-outline" /></View><Text numberOfLines={1} className="mt-2 text-xs font-semibold text-[#444]">{category.name}</Text></Pressable>)}</ScrollView>}

      <View className="mt-8"><SectionTitle title="Markets for you" subtitle={selectedState.code === ALL_STATES.code ? 'Across Hook' : selectedState.name} />
        {vendorsQuery.isLoading ? <View className="h-52 items-center justify-center"><HookLoader label="Finding markets" /></View> : vendors.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>{vendors.map((vendor) => <Pressable key={vendor.id} onPress={() => router.push(`/(app)/vendor/${vendor.id}`)} className="w-[274px] overflow-hidden rounded-[24px] bg-white"><View className="relative h-40 bg-[#e8e8ea]"><RemoteImage uri={vendor.imageUrl} fallbackIcon="storefront-outline" /><View className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1.5"><Text className="text-[11px] font-bold text-white">{vendor.productCount || 0} products</Text></View></View><View className="p-4"><Text numberOfLines={1} className="text-base font-black">{vendor.businessName}</Text><Text numberOfLines={2} className="mt-1 min-h-9 text-xs leading-4 text-[#777]">{vendor.description || 'Browse approved products from this Hook market.'}</Text><View className="mt-3 flex-row items-center"><Ionicons name="bicycle-outline" size={15} /><Text className="ml-1.5 text-xs font-bold">Delivery available</Text></View></View></Pressable>)}</ScrollView> : <View className="mx-5 items-center rounded-[22px] bg-white p-8"><Ionicons name="storefront-outline" size={30} color="#999" /><Text className="mt-3 font-bold">No markets available</Text><Text className="mt-1 text-center text-xs text-[#777]">Try another operating state.</Text></View>}
      </View>

      <View className="mx-5 mt-8 flex-row items-center overflow-hidden rounded-[24px] bg-[#171717] p-5"><View className="flex-1"><Text className="text-lg font-black text-white">Shopping at a booth?</Text><Text className="mt-1 text-xs leading-5 text-white/60">Scan its QR or enter the six-digit code to see verified inventory.</Text><Pressable onPress={() => router.push('/(tabs)/scan')} className="mt-4 self-start rounded-full bg-hook px-4 py-2.5"><Text className="text-xs font-black">Open scanner</Text></Pressable></View><Ionicons name="qr-code-outline" size={64} color="#FFC809" /></View>
    </ScrollView>
    <StateDropdownSheet visible={stateOpen} onClose={() => setStateOpen(false)} selectedCode={selectedState.code} onSelect={chooseState} />
  </View>;
}

function SectionTitle({ title, subtitle, action, onPress }: { title: string; subtitle?: string; action?: string; onPress?: () => void }) { return <View className="mb-4 flex-row items-end justify-between px-5"><View><Text className="text-xl font-black tracking-tight">{title}</Text>{subtitle ? <Text className="mt-0.5 text-xs text-[#777]">{subtitle}</Text> : null}</View>{action ? <Pressable onPress={onPress}><Text className="text-xs font-bold text-[#666]">{action}</Text></Pressable> : null}</View>; }
