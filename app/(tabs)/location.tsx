import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartButton } from '@/components/features/cart/CartButton';
import { HookLoader } from '@/components/shared/HookLoader';
import { RemoteImage } from '@/components/shared/RemoteImage';
import { SearchField } from '@/components/shared/SearchField';
import { useCategoriesQuery, useProductsQuery } from '@/lib/mobile-api';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState(params.categoryId || 'all');
  useEffect(() => { const timer = setTimeout(() => setQuery(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  const categoriesQuery = useCategoriesQuery();
  const productsQuery = useProductsQuery({ ...(query ? { q: query } : {}), ...(categoryId !== 'all' ? { categoryId } : {}), limit: 40 });
  const categories = categoriesQuery.data || [];
  const products = useMemo(() => productsQuery.data?.data || [], [productsQuery.data]);
  const loading = productsQuery.isLoading || categoriesQuery.isLoading;
  const refreshing = productsQuery.isRefetching;

  return <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
    <View className="px-5 pb-3 pt-3"><View className="flex-row items-center justify-between"><View><Text className="text-[30px] font-black tracking-tight">Discover</Text><Text className="mt-0.5 text-sm text-[#777]">Explore Hook&apos;s commercial catalog</Text></View><CartButton tone="white" /></View><View className="mt-5"><SearchField value={search} onChangeText={setSearch} placeholder="Search products" /></View></View>
    <FlatList
      data={products}
      numColumns={2}
      keyExtractor={(item) => item.publicId}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void productsQuery.refetch(); }} tintColor="#111" />}
      ListHeaderComponent={<View className="pb-2"><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}><FilterChip label="All" active={categoryId === 'all'} onPress={() => setCategoryId('all')} />{categories.map((category) => <FilterChip key={category.publicId} label={category.name} active={categoryId === category.publicId} onPress={() => setCategoryId(category.publicId)} />)}</ScrollView><View className="mb-3 mt-6 flex-row items-center justify-between"><Text className="text-lg font-black">{query ? `Results for “${query}”` : 'Products'}</Text><Text className="text-xs font-semibold text-[#777]">{products.length} found</Text></View>{loading ? <View className="h-36 items-center justify-center"><HookLoader label="Finding products" /></View> : null}</View>}
      renderItem={({ item }) => <ProductCard product={item} />}
      ListEmptyComponent={!loading ? <View className="mt-16 items-center px-8"><View className="h-16 w-16 items-center justify-center rounded-full bg-white"><Ionicons name="search-outline" size={29} color="#999" /></View><Text className="mt-4 text-lg font-black">Nothing found</Text><Text className="mt-2 text-center text-sm leading-5 text-[#777]">Try a different search or choose another category.</Text></View> : null}
    />
  </View>;
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} className={`h-10 justify-center rounded-full border px-4 ${active ? 'border-black bg-black' : 'border-black/5 bg-white'}`}><Text numberOfLines={1} className={`text-xs font-bold ${active ? 'text-white' : 'text-[#555]'}`}>{label}</Text></Pressable>; }
function ProductCard({ product }: { product: import('@/lib/mobile-api').PublicCatalogProduct }) { return <View className="flex-1 overflow-hidden rounded-[20px] bg-white p-2.5"><View className="relative aspect-square overflow-hidden rounded-[15px] bg-[#eee]"><RemoteImage uri={product.media?.[0]?.url} /></View><Text numberOfLines={2} className="mt-3 min-h-10 text-sm font-bold leading-5">{product.title}</Text><Text className="mt-1 text-base font-black">₦{(product.effectivePriceMinor / 100).toLocaleString()}</Text><Text numberOfLines={1} className="mt-1 text-[11px] text-[#777]">{product.category?.name || 'Hook marketplace'}</Text></View>; }
