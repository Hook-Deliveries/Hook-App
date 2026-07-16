import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HookLoader } from '@/components/shared/HookLoader';
import { toast } from '@/components/shared/toast';
import { apiRequest } from '@/lib/api';
import { useCartQuery, useCheckoutMutation, useInitializePaymentMutation } from '@/lib/mobile-api';

type Mode = 'standard' | 'gift';
const fieldClass = 'h-13 rounded-2xl border border-black/10 bg-white px-4 text-sm text-black';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const cart = useCartQuery();
  const checkout = useCheckoutMutation();
  const initialize = useInitializePaymentMutation();
  const [mode, setMode] = useState<Mode>('standard');
  const [form, setForm] = useState({ name: '', email: '', phone: '', street: '', city: 'Lagos', state: 'Lagos', recipientName: '', recipientEmail: '', recipientPhone: '', message: '' });
  const data = cart.data as any;
  const busy = checkout.isPending || initialize.isPending;
  function update(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })); }

  async function submit() {
    if (!form.phone || !form.street || !form.city || !form.state) return toast.error('Complete the delivery details');
    if (mode === 'gift' && (!form.recipientName || !form.recipientEmail || !form.recipientPhone)) return toast.error('Complete the gift recipient details');
    try {
      const order = await checkout.mutateAsync({
        guestName: form.name || undefined, guestEmail: form.email || undefined,
        deliveryAddress: { street: form.street, city: form.city, state: form.state, phone: mode === 'gift' ? form.recipientPhone : form.phone },
        paymentMode: 'pay_now', orderType: mode,
        giftRecipient: mode === 'gift' ? { name: form.recipientName, email: form.recipientEmail, phone: form.recipientPhone, address: { street: form.street, city: form.city, state: form.state, phone: form.recipientPhone }, message: form.message || undefined } : undefined,
      }) as any;
      const payment = await initialize.mutateAsync({ orderId: order.id, gateway: 'opay', paymentMethod: 'card' }) as any;
      if (!payment.cashierUrl) throw new Error('OPay checkout is currently unavailable');
      await WebBrowser.openAuthSessionAsync(payment.cashierUrl, 'hook://payments/return');
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const status = await apiRequest<any>(`/payments/orders/${order.id}/status`);
        if (status.paymentStatus === 'successful') {
          toast.success(mode === 'gift' ? 'Gift order paid successfully' : 'Payment confirmed');
          router.replace('/(tabs)/orders');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      toast.info('Payment is being confirmed', 'You can track it from your orders.');
      router.replace('/(tabs)/orders');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Checkout could not be completed'); }
  }

  if (cart.isLoading) return <View className="flex-1 items-center justify-center bg-[#f4f4f5]"><HookLoader label="Loading checkout" /></View>;
  if (!data?.items?.length) return <View className="flex-1 items-center justify-center bg-[#f4f4f5] px-8"><Ionicons name="bag-outline" size={48} color="#aaa" /><Text className="mt-4 text-xl font-bold">Your cart is empty</Text><Pressable onPress={() => router.back()} className="mt-5 rounded-full bg-hook px-6 py-3"><Text className="font-bold">Continue shopping</Text></Pressable></View>;

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}><ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
    <View className="flex-row items-center gap-3"><Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full bg-white"><Ionicons name="arrow-back" size={21} /></Pressable><View><Text className="text-2xl font-black">Checkout</Text><Text className="text-xs text-[#666]">{data.items.length} item{data.items.length === 1 ? '' : 's'} · ₦{Number(data.total || 0).toLocaleString()}</Text></View></View>
    <View className="mt-5 rounded-[20px] bg-white p-4"><Text className="font-bold">Order type</Text><View className="mt-3 flex-row rounded-2xl bg-[#f3f3f4] p-1">{(['standard', 'gift'] as Mode[]).map((item) => <Pressable key={item} onPress={() => setMode(item)} className={`flex-1 items-center rounded-xl py-3 ${mode === item ? 'bg-hook' : ''}`}><Text className="text-sm font-bold capitalize">{item}</Text></Pressable>)}</View>{mode === 'gift' && <Text className="mt-3 text-xs leading-5 text-[#666]">Gift orders are paid first and delivered directly to the recipient. No claim or registration is required.</Text>}</View>
    <View className="mt-4 gap-3 rounded-[20px] bg-white p-4"><Text className="font-bold">Delivery details</Text><TextInput className={fieldClass} placeholder="Your name" value={form.name} onChangeText={(v) => update('name', v)} /><TextInput className={fieldClass} placeholder="Your email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => update('email', v)} /><TextInput className={fieldClass} placeholder={mode === 'gift' ? 'Recipient delivery street' : 'Delivery street'} value={form.street} onChangeText={(v) => update('street', v)} /><View className="flex-row gap-3"><TextInput className={`${fieldClass} flex-1`} placeholder="City" value={form.city} onChangeText={(v) => update('city', v)} /><TextInput className={`${fieldClass} flex-1`} placeholder="State" value={form.state} onChangeText={(v) => update('state', v)} /></View><TextInput className={fieldClass} placeholder="Your phone" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => update('phone', v)} /></View>
    {mode === 'gift' && <View className="mt-4 gap-3 rounded-[20px] bg-white p-4"><Text className="font-bold">Gift recipient</Text><TextInput className={fieldClass} placeholder="Recipient name" value={form.recipientName} onChangeText={(v) => update('recipientName', v)} /><TextInput className={fieldClass} placeholder="Recipient email" keyboardType="email-address" autoCapitalize="none" value={form.recipientEmail} onChangeText={(v) => update('recipientEmail', v)} /><TextInput className={fieldClass} placeholder="Recipient phone" keyboardType="phone-pad" value={form.recipientPhone} onChangeText={(v) => update('recipientPhone', v)} /><TextInput className={`${fieldClass} h-24 pt-4`} multiline placeholder="Gift message (optional)" value={form.message} onChangeText={(v) => update('message', v)} /></View>}
    <View className="mt-4 rounded-[20px] bg-white p-4"><View className="flex-row justify-between"><Text className="text-[#666]">Delivery</Text><Text className="font-semibold">₦{Number(data.deliveryFee || 3000).toLocaleString()}</Text></View><View className="mt-2 flex-row justify-between"><Text className="font-bold">Total</Text><Text className="text-lg font-black">₦{Number(data.total || 0).toLocaleString()}</Text></View></View>
    <Pressable disabled={busy} onPress={submit} className="mt-5 h-14 items-center justify-center rounded-2xl bg-hook">{busy ? <HookLoader size="button" /> : <Text className="font-bold">Pay securely with OPay</Text>}</Pressable>
  </ScrollView></KeyboardAvoidingView>;
}
