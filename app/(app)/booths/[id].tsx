import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoothProductCard } from '@/components/features/booths/BoothProductCard';
import { CartButton } from '@/components/features/cart/CartButton';
import { HookLoader } from '@/components/shared/HookLoader';
import { RemoteImage } from '@/components/shared/RemoteImage';
import { useBoothCatalogQuery } from '@/lib/mobile-api';

export default function BoothCatalogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const query = useBoothCatalogQuery(id);
  const [categoryId, setCategoryId] = useState('all');
  const data = query.data;
  const products = useMemo(() => (data?.products || []).filter((product: any) => categoryId === 'all' || product.categoryId === categoryId), [categoryId, data?.products]);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => { scrollY.value = event.contentOffset.y; });
  const compactTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [70, 125], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [70, 125], [6, 0], Extrapolation.CLAMP) }],
  }));
  const heroTitleStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [25, 105], [1, 0], Extrapolation.CLAMP) }));

  if (query.isLoading) return <View className="flex-1 items-center justify-center bg-[#f4f4f5]"><HookLoader label="Loading booth inventory" /></View>;
  if (query.isError || !data) return <ErrorState retry={() => query.refetch()} />;

  return <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
    <View className="z-10 h-[60px] flex-row items-center justify-between border-b border-black/5 bg-[#f4f4f5]/95 px-4"><Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full bg-white"><Ionicons name="arrow-back" size={21} /></Pressable><Animated.View pointerEvents="none" style={compactTitleStyle} className="absolute inset-x-16 items-center"><Text numberOfLines={1} className="max-w-full text-base font-black">{data.booth.name}</Text><Text numberOfLines={1} className="mt-0.5 text-[11px] text-[#777]">{data.total} products</Text></Animated.View><CartButton /></View>
    <Animated.FlatList
      data={products}
      numColumns={2}
      keyExtractor={(item: any) => item.id}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110, gap: 12 }}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor="#111" colors={['#FFC809']} />}
      onScroll={onScroll}
      scrollEventThrottle={16}
      ListHeaderComponent={<View className="pb-2">
        <View className="h-40 overflow-hidden rounded-[22px] bg-[#171717]"><RemoteImage uri={data.booth.previewImageUrl} fallbackIcon="storefront-outline" /><View className="absolute inset-0 justify-end bg-black/35 p-4"><Animated.View style={heroTitleStyle}><Text numberOfLines={1} className="text-xl font-black text-white">{data.booth.name}</Text><Text numberOfLines={1} className="mt-1 text-xs text-white/80">{data.booth.location?.address || `${data.total} approved products`}</Text></Animated.View></View></View>
        <View className="mb-3 mt-5 flex-row items-center justify-between"><Text className="text-lg font-black">Categories</Text><Text className="text-xs font-semibold text-[#777]">{products.length} shown</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 5 }}><CategoryChip active={categoryId === 'all'} label="All" count={data.total} onPress={() => setCategoryId('all')} />{data.categories.map((category) => <CategoryChip key={category.id} active={categoryId === category.id} label={category.name} count={category.productCount} onPress={() => setCategoryId(category.id)} />)}</ScrollView>
        <Text className="mb-3 mt-5 text-lg font-black">Products</Text>
      </View>}
      ListEmptyComponent={<View className="col-span-2 mt-16 items-center px-8"><View className="h-16 w-16 items-center justify-center rounded-full bg-white"><Ionicons name="cube-outline" size={30} color="#aaa" /></View><Text className="mt-4 text-lg font-black">No products in this category</Text><Text className="mt-2 text-center text-sm text-[#777]">Choose another category to continue shopping this booth.</Text></View>}
      renderItem={({ item }) => <BoothProductCard boothId={id} product={item} />}
    />
  </View>;
}

function CategoryChip({ active, label, count, onPress }: { active: boolean; label: string; count: number; onPress: () => void }) {
  return <Pressable onPress={onPress} className={`h-10 flex-row items-center gap-2 rounded-full border px-4 ${active ? 'border-black bg-black' : 'border-black/10 bg-white'}`}><Text numberOfLines={1} className={`text-sm font-bold ${active ? 'text-white' : 'text-black'}`}>{label}</Text><Text className={`text-xs ${active ? 'text-white/60' : 'text-[#888]'}`}>{count}</Text></Pressable>;
}

function ErrorState({ retry }: { retry: () => void }) {
  return <View className="flex-1 items-center justify-center bg-[#f4f4f5] px-8"><View className="h-16 w-16 items-center justify-center rounded-full bg-white"><Ionicons name="storefront-outline" size={30} color="#aaa" /></View><Text className="mt-4 text-center text-xl font-black">Booth session unavailable</Text><Text className="mt-2 text-center text-sm leading-5 text-[#777]">The booth may be inactive, its access may have changed, or your session has expired.</Text><View className="mt-5 flex-row gap-3"><Pressable onPress={retry} className="rounded-full bg-white px-5 py-3"><Text className="font-bold">Try again</Text></Pressable><Pressable onPress={() => router.replace('/(tabs)/scan')} className="rounded-full bg-hook px-5 py-3"><Text className="font-bold">Scan booth</Text></Pressable></View></View>;
}
