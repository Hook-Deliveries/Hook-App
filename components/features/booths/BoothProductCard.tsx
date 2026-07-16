import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { HookLoader } from '@/components/shared/HookLoader';
import { RemoteImage } from '@/components/shared/RemoteImage';
import { toast } from '@/components/shared/toast';
import { useAddCartItemMutation } from '@/lib/mobile-api';

export function BoothProductCard({ boothId, product }: { boothId: string; product: any }) {
  const add = useAddCartItemMutation();
  const href = { pathname: '/booths/[id]/products/[productId]', params: { id: boothId, productId: product.id } } as never;
  const hasVariants = Boolean(product.colors?.length || product.sizes?.length);
  async function quickAdd() {
    if (hasVariants) return router.push(href);
    try { await add.mutateAsync({ productId: product.id, quantity: 1 }); toast.success('Added to cart', product.title); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not add product'); }
  }
  return <View className="flex-1 overflow-hidden rounded-[20px] border border-black/5 bg-white p-2.5">
    <Pressable onPress={() => router.push(href)} className="overflow-hidden rounded-[15px] bg-[#f2f2f3]"><View className="aspect-square"><RemoteImage uri={product.images?.[0]} />{!product.isAvailable ? <View className="absolute inset-0 items-center justify-center bg-white/75"><Text className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white">Out of stock</Text></View> : null}</View></Pressable>
    <Pressable onPress={() => router.push(href)}><Text numberOfLines={2} className="mt-3 min-h-10 text-[14px] font-bold leading-5 text-black">{product.title}</Text><Text numberOfLines={1} className="mt-1 text-[15px] font-black text-black">₦{Number(product.sellingPrice || 0).toLocaleString()}</Text><Text numberOfLines={1} className="mt-1 text-[11px] text-[#777]">{product.category?.name || 'Booth inventory'}</Text></Pressable>
    <Pressable disabled={!product.isAvailable || add.isPending} onPress={quickAdd} className={`mt-3 h-10 items-center justify-center rounded-xl ${product.isAvailable ? 'bg-hook' : 'bg-[#eee]'}`}>{add.isPending ? <HookLoader size="button" /> : <Text className={`text-xs font-black ${product.isAvailable ? 'text-black' : 'text-[#999]'}`}>{hasVariants ? 'Choose options' : 'Add to cart'}</Text>}</Pressable>
  </View>;
}
