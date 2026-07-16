import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartButton } from '@/components/features/cart/CartButton';
import { HookLoader } from '@/components/shared/HookLoader';
import { RemoteImage } from '@/components/shared/RemoteImage';
import { toast } from '@/components/shared/toast';
import { useAddCartItemMutation, useBoothProductQuery } from '@/lib/mobile-api';

export default function BoothProductScreen() {
  const { id, productId } = useLocalSearchParams<{ id: string; productId: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const query = useBoothProductQuery(id, productId);
  const add = useAddCartItemMutation();
  const [imageIndex, setImageIndex] = useState(0);
  const [color, setColor] = useState<string>();
  const [size, setSize] = useState<string>();
  const product = (query.data as any)?.product;
  const booth = (query.data as any)?.booth;
  const galleryWidth = width - 32;

  if (query.isLoading) return <View className="flex-1 items-center justify-center bg-[#f4f4f5]"><HookLoader label="Loading product" /></View>;
  if (!product) return <Unavailable retry={() => query.refetch()} />;

  async function addToCart() {
    if (!product.isAvailable) return toast.error('This product is currently out of stock');
    if (product.colors?.length && !color) return toast.error('Choose a color');
    if (product.sizes?.length && !size) return toast.error('Choose a size');
    try { await add.mutateAsync({ productId: product.id, quantity: 1, selectedVariants: { color, size } }); toast.success('Added to cart', product.title); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not add product'); }
  }

  const images = product.images?.length ? product.images : [null];
  return <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between px-4 py-3"><Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full bg-white"><Ionicons name="arrow-back" size={21} /></Pressable><Text numberOfLines={1} className="max-w-[55%] text-base font-bold">Product details</Text><CartButton /></View>
      <View className="mx-4 overflow-hidden rounded-[24px] bg-white">
        <FlatList horizontal pagingEnabled data={images} keyExtractor={(item, index) => String(item || index)} showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(event) => setImageIndex(Math.round(event.nativeEvent.contentOffset.x / galleryWidth))} renderItem={({ item }) => <View style={{ width: galleryWidth }} className="aspect-square bg-[#f3f3f4]"><RemoteImage uri={item} /></View>} />
        {images.length > 1 ? <View className="absolute bottom-4 self-center rounded-full bg-black/55 px-3 py-1.5"><Text className="text-xs font-bold text-white">{imageIndex + 1} / {images.length}</Text></View> : null}
      </View>
      <View className="mx-4 mt-4 rounded-[24px] bg-white p-5">
        <View className="flex-row items-start justify-between gap-3"><View className="min-w-0 flex-1"><Text className="text-2xl font-black leading-8">{product.title}</Text><Text className="mt-1 text-sm text-[#777]">{product.category?.name || 'Booth product'}</Text></View><View className={`rounded-full px-3 py-1.5 ${product.isAvailable ? 'bg-emerald-50' : 'bg-red-50'}`}><Text className={`text-xs font-bold ${product.isAvailable ? 'text-emerald-700' : 'text-red-600'}`}>{product.isAvailable ? `${product.availableQuantity} available` : 'Out of stock'}</Text></View></View>
        <View className="mt-5 flex-row items-end gap-3"><Text className="text-2xl font-black">₦{Number(product.sellingPrice || 0).toLocaleString()}</Text>{Number(product.costPrice) > Number(product.sellingPrice) ? <Text className="pb-1 text-sm text-[#999] line-through">₦{Number(product.costPrice).toLocaleString()}</Text> : null}</View>
        <View className="mt-4 flex-row items-center gap-4"><View className="flex-row items-center gap-1"><Ionicons name="star" size={16} color="#FFC809" /><Text className="text-sm font-bold">{Number(product.averageRating || 0).toFixed(1)}</Text></View><View className="h-4 w-px bg-black/10" /><Text className="text-sm text-[#666]">Sold by {product.vendor?.businessName || 'Hook vendor'}</Text></View>
        {product.colors?.length ? <OptionSection title="Color">{product.colors.map((item: string) => <ColorSwatch key={item} value={item} selected={color === item} onPress={() => setColor(item)} />)}</OptionSection> : null}
        {product.sizes?.length ? <OptionSection title="Size">{product.sizes.map((item: string) => <Pressable key={item} onPress={() => setSize(item)} className={`min-w-14 items-center rounded-xl border px-3 py-3 ${size === item ? 'border-black bg-black' : 'border-black/10 bg-white'}`}><Text className={size === item ? 'font-bold text-white' : 'font-bold text-black'}>{item}</Text></Pressable>)}</OptionSection> : null}
      </View>
      <View className="mx-4 mt-4 rounded-[24px] bg-white p-5"><Text className="text-lg font-black">About this product</Text><Text className="mt-3 text-sm leading-6 text-[#626262]">{product.description || 'Approved inventory available from this Hook booth.'}</Text></View>
      <Pressable onPress={() => router.push({ pathname: '/booths/[id]', params: { id } } as never)} className="mx-4 mt-4 flex-row items-center gap-3 rounded-[20px] bg-white p-4"><View className="h-11 w-11 items-center justify-center rounded-full bg-hook/20"><Ionicons name="storefront-outline" size={21} /></View><View className="min-w-0 flex-1"><Text className="font-bold">{booth?.name}</Text><Text numberOfLines={1} className="mt-0.5 text-xs text-[#777]">{booth?.location?.address || 'Return to booth inventory'}</Text></View><Ionicons name="chevron-forward" size={19} color="#777" /></Pressable>
    </ScrollView>
    <View className="absolute inset-x-0 bottom-0 border-t border-black/5 bg-white px-4 pt-3" style={{ paddingBottom: insets.bottom + 10 }}><Pressable disabled={add.isPending || !product.isAvailable} onPress={addToCart} className={`h-14 items-center justify-center rounded-2xl ${product.isAvailable ? 'bg-hook' : 'bg-[#e5e5e5]'}`}>{add.isPending ? <HookLoader size="button" /> : <Text className={`font-black ${product.isAvailable ? 'text-black' : 'text-[#999]'}`}>{product.isAvailable ? 'Add to cart' : 'Currently unavailable'}</Text>}</Pressable></View>
  </View>;
}

function OptionSection({ title, children }: { title: string; children: React.ReactNode }) { return <View className="mt-6"><Text className="font-black">{title}</Text><View className="mt-3 flex-row flex-wrap gap-3">{children}</View></View>; }
function ColorSwatch({ value, selected, onPress }: { value: string; selected: boolean; onPress: () => void }) {
  const rgb = value.match(/^#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i);
  const brightness = rgb ? (Number.parseInt(rgb[1], 16) * 299 + Number.parseInt(rgb[2], 16) * 587 + Number.parseInt(rgb[3], 16) * 114) / 1000 : 0;
  return <Pressable accessibilityRole="radio" accessibilityLabel={`Select color ${value}`} accessibilityState={{ selected }} onPress={onPress} className={`h-12 w-12 items-center justify-center rounded-full border-[3px] ${selected ? 'border-black' : 'border-[#d4d4d8]'}`} style={{ backgroundColor: value }}>{selected ? <Ionicons name="checkmark" size={21} color={brightness > 165 ? '#111111' : '#FFFFFF'} /> : null}</Pressable>;
}
function Unavailable({ retry }: { retry: () => void }) { return <View className="flex-1 items-center justify-center bg-[#f4f4f5] px-8"><Ionicons name="cube-outline" size={48} color="#aaa" /><Text className="mt-4 text-xl font-black">Product unavailable</Text><Text className="mt-2 text-center text-sm text-[#777]">It may have been removed from this booth or your booth session expired.</Text><View className="mt-5 flex-row gap-3"><Pressable onPress={retry} className="rounded-full bg-white px-5 py-3"><Text className="font-bold">Try again</Text></Pressable><Pressable onPress={() => router.replace('/(tabs)/scan')} className="rounded-full bg-hook px-5 py-3"><Text className="font-bold">Scan booth</Text></Pressable></View></View>; }
