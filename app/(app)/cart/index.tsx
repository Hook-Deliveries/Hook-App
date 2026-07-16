import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetModal } from '@/components/shared/BottomSheetModal';
import { HookLoader } from '@/components/shared/HookLoader';
import { RemoteImage } from '@/components/shared/RemoteImage';
import { toast } from '@/components/shared/toast';
import { useCartQuery, useClearCartMutation, useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/lib/mobile-api';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const cart = useCartQuery();
  const update = useUpdateCartItemMutation();
  const remove = useRemoveCartItemMutation();
  const clear = useClearCartMutation();
  const [workingId, setWorkingId] = useState<string>();
  const [confirmClear, setConfirmClear] = useState(false);
  const data = cart.data as any;
  const isBoothCart = Boolean(data?.boothId);

  async function change(item: any, quantity: number) {
    if (quantity < 1 || workingId) return;
    setWorkingId(item.id);
    try { await update.mutateAsync({ itemId: item.id, quantity }); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update quantity'); }
    finally { setWorkingId(undefined); }
  }
  async function removeItem(item: any) {
    if (workingId) return;
    setWorkingId(item.id);
    try { await remove.mutateAsync(item.id); toast.success('Item removed'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not remove item'); }
    finally { setWorkingId(undefined); }
  }
  async function clearCart() {
    try { await clear.mutateAsync(); setConfirmClear(false); toast.success('Cart cleared'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not clear cart'); }
  }
  function continueShopping() {
    if (!isBoothCart) return router.push('/(tabs)' as never);
    if (!data?.boothSessionValid) { toast.info('Reopen this booth', 'Scan its QR or enter its access code to continue shopping.'); return router.push('/(tabs)/scan'); }
    router.push({ pathname: '/booths/[id]', params: { id: data.boothId } } as never);
  }
  function checkout() {
    if (data?.unavailableItemCount) return toast.error('Review unavailable items before checkout');
    if (isBoothCart && !data?.boothSessionValid) { toast.info('Booth verification required', 'Reopen the booth before checking out.'); return router.push('/(tabs)/scan'); }
    router.push('/checkout' as never);
  }

  if (cart.isLoading) return <View className="flex-1 items-center justify-center bg-[#f4f4f5]"><HookLoader label="Loading your cart" /></View>;
  if (cart.isError) return <CartError retry={() => cart.refetch()} />;
  const items = data?.items || [];
  if (!items.length) return <EmptyCart />;

  return <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
    <View className="flex-row items-center justify-between px-4 py-3"><Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full bg-white"><Ionicons name="arrow-back" size={21} /></Pressable><Text className="text-xl font-black">Your cart</Text><Pressable onPress={() => setConfirmClear(true)} className="h-11 items-center justify-center px-2"><Text className="text-sm font-bold text-red-500">Clear</Text></Pressable></View>
    <ScrollView refreshControl={<RefreshControl refreshing={cart.isRefetching} onRefresh={cart.refetch} tintColor="#111" />} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 180 }}>
      <Pressable onPress={continueShopping} className="flex-row items-center gap-3 rounded-[22px] bg-[#171717] p-4"><View className="h-12 w-12 overflow-hidden rounded-xl bg-white/10">{isBoothCart ? <RemoteImage uri={data.booth?.previewImageUrl} fallbackIcon="storefront-outline" /> : <View className="size-full items-center justify-center"><Ionicons name="bag-handle-outline" size={22} color="#FFC809" /></View>}</View><View className="min-w-0 flex-1"><View className="flex-row items-center gap-2"><Text numberOfLines={1} className="max-w-[85%] font-black text-white">{isBoothCart ? data.booth?.name || 'Hook booth' : 'Hook marketplace'}</Text>{isBoothCart ? <View className={`h-2 w-2 rounded-full ${data.boothSessionValid ? 'bg-emerald-400' : 'bg-amber-400'}`} /> : null}</View><Text numberOfLines={1} className="mt-1 text-xs text-white/60">{isBoothCart ? (data.boothSessionValid ? 'Continue shopping at this booth' : 'Reopen booth to add products or checkout') : 'Continue browsing products'}</Text></View><Ionicons name="chevron-forward" size={19} color="#fff" /></Pressable>
      <View className="mt-4 gap-3">{items.map((item: any) => <CartRow key={item.id} item={item} busy={workingId === item.id} onChange={(quantity) => change(item, quantity)} onRemove={() => removeItem(item)} />)}</View>
      <View className="mt-5 rounded-[22px] bg-white p-5"><SummaryRow label="Subtotal" value={data.subtotal} /><SummaryRow label="Delivery fee" value={data.deliveryFee || 3000} /><View className="my-4 h-px bg-black/5" /><SummaryRow label="Total" value={data.total} strong /></View>
    </ScrollView>
    <View className="absolute inset-x-0 bottom-0 border-t border-black/5 bg-white px-4 pt-3" style={{ paddingBottom: insets.bottom + 10 }}><Pressable onPress={checkout} className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-hook"><Text className="font-black">Proceed to checkout</Text><Ionicons name="arrow-forward" size={19} /></Pressable></View>
    <BottomSheetModal visible={confirmClear} onClose={() => setConfirmClear(false)} title="Clear your cart?"><Text className="text-center text-sm leading-6 text-[#666]">{isBoothCart ? `This removes every item and disconnects the cart from ${data.booth?.name || 'this booth'}.` : 'This removes every item currently saved in your cart.'}</Text><View className="mt-6 flex-row gap-3"><Pressable onPress={() => setConfirmClear(false)} className="h-13 flex-1 items-center justify-center rounded-2xl bg-[#f1f1f3]"><Text className="font-bold">Keep items</Text></Pressable><Pressable disabled={clear.isPending} onPress={() => void clearCart()} className="h-13 flex-1 items-center justify-center rounded-2xl bg-red-500">{clear.isPending ? <HookLoader size="button" variant="dark" /> : <Text className="font-bold text-white">Clear cart</Text>}</Pressable></View></BottomSheetModal>
  </View>;
}

function CartRow({ item, busy, onChange, onRemove }: { item: any; busy: boolean; onChange: (quantity: number) => void; onRemove: () => void }) {
  const product = item.product;
  return <View className={`flex-row gap-3 rounded-[22px] bg-white p-3 ${item.isAvailable ? '' : 'border border-red-100'}`}><View className="h-24 w-24 overflow-hidden rounded-[16px] bg-[#f1f1f3]"><RemoteImage uri={product?.images?.[0]} /></View><View className="min-w-0 flex-1"><View className="flex-row items-start justify-between gap-2"><Text numberOfLines={2} className="flex-1 text-sm font-black leading-5">{product?.title || 'Unavailable product'}</Text><Pressable onPress={onRemove} hitSlop={8}><Ionicons name="close-circle" size={20} color="#aaa" /></Pressable></View>{item.selectedVariants?.color || item.selectedVariants?.size ? <Text numberOfLines={1} className="mt-1 text-xs text-[#777]">{[item.selectedVariants?.color, item.selectedVariants?.size].filter(Boolean).join(' · ')}</Text> : null}<Text className="mt-2 text-sm font-black">₦{Number(item.totalPrice || 0).toLocaleString()}</Text><View className="mt-2 flex-row items-center justify-between">{!item.isAvailable ? <Text className="text-xs font-bold text-red-500">Stock changed</Text> : <View className="flex-row items-center rounded-full bg-[#f2f2f3] p-1"><Pressable disabled={busy || item.quantity <= 1} onPress={() => onChange(item.quantity - 1)} className="h-7 w-7 items-center justify-center rounded-full bg-white"><Ionicons name="remove" size={15} /></Pressable><View className="w-9 items-center">{busy ? <HookLoader size="button" /> : <Text className="text-xs font-black">{item.quantity}</Text>}</View><Pressable disabled={busy || item.quantity >= item.availableQuantity} onPress={() => onChange(item.quantity + 1)} className="h-7 w-7 items-center justify-center rounded-full bg-white"><Ionicons name="add" size={15} /></Pressable></View>}</View></View></View>;
}
function SummaryRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) { return <View className="flex-row items-center justify-between"><Text className={strong ? 'text-base font-black' : 'text-sm text-[#666]'}>{label}</Text><Text className={strong ? 'text-xl font-black' : 'text-sm font-bold'}>₦{Number(value || 0).toLocaleString()}</Text></View>; }
function EmptyCart() { const insets = useSafeAreaInsets(); return <View className="flex-1 items-center justify-center bg-[#f4f4f5] px-8" style={{ paddingTop: insets.top }}><View className="h-20 w-20 items-center justify-center rounded-full bg-white"><Ionicons name="bag-outline" size={36} color="#aaa" /></View><Text className="mt-5 text-xl font-black">Your cart is empty</Text><Text className="mt-2 text-center text-sm leading-5 text-[#777]">Products you add from Hook’s marketplace or a verified booth will appear here.</Text><View className="mt-6 flex-row gap-3"><Pressable onPress={() => router.replace('/(tabs)' as never)} className="rounded-full bg-black px-5 py-3.5"><Text className="font-black text-white">Browse Hook</Text></Pressable><Pressable onPress={() => router.replace('/(tabs)/scan')} className="rounded-full bg-hook px-5 py-3.5"><Text className="font-black">Scan booth</Text></Pressable></View></View>; }
function CartError({ retry }: { retry: () => void }) { return <View className="flex-1 items-center justify-center bg-[#f4f4f5] px-8"><Ionicons name="cloud-offline-outline" size={44} color="#aaa" /><Text className="mt-4 text-xl font-black">Cart unavailable</Text><Text className="mt-2 text-center text-sm text-[#777]">Check your connection and try again.</Text><Pressable onPress={retry} className="mt-5 rounded-full bg-hook px-6 py-3"><Text className="font-bold">Try again</Text></Pressable></View>; }
