import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoothScanner } from '@/components/features/booths/BoothScanner';
import { HookLoader } from '@/components/shared/HookLoader';
import { toast } from '@/components/shared/toast';
import { apiRequest } from '@/lib/api';
import { getBoothSession, restoreBoothSession, saveBoothSession } from '@/lib/booth-session';
import type { BoothQrCredential } from '@/lib/booth-qr';
import { useResolveBoothMutation } from '@/lib/mobile-api';

type Mode = 'scan' | 'code';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('scan');
  const [code, setCode] = useState('');
  const requestLocked = useRef(false);
  const resolve = useResolveBoothMutation();

  useFocusEffect(useCallback(() => {
    requestLocked.current = false;
    return () => { requestLocked.current = true; };
  }, []));

  async function openBooth(input: { code?: string } | BoothQrCredential) {
    if (requestLocked.current || resolve.isPending) return;
    requestLocked.current = true;
    try {
      const previous = await getBoothSession();
      const result = await resolve.mutateAsync(input);
      const cart = await apiRequest<any>('/cart', { headers: previous?.boothSessionToken ? { 'X-Booth-Session': previous.boothSessionToken } : undefined });
      if (cart?.items?.length && cart.boothId && cart.boothId !== result.booth.id) {
        await restoreBoothSession(previous);
        Alert.alert('Switch booth?', 'Your cart belongs to another booth. Switching clears those items so all products remain linked to one booth.', [
          { text: 'Keep current cart', style: 'cancel', onPress: () => { requestLocked.current = false; } },
          { text: 'Clear and switch', style: 'destructive', onPress: () => void switchBooth(result) },
        ]);
        return;
      }
      router.push({ pathname: '/booths/[id]', params: { id: result.booth.id } } as never);
    } catch (error) {
      requestLocked.current = false;
      toast.error(error instanceof Error ? error.message : 'This booth could not be opened');
    }
  }

  async function switchBooth(result: any) {
    try {
      await apiRequest('/cart', { method: 'DELETE' });
      await saveBoothSession(result);
      router.push({ pathname: '/booths/[id]', params: { id: result.booth.id } } as never);
    } catch (error) { requestLocked.current = false; toast.error(error instanceof Error ? error.message : 'Could not switch booth'); }
  }

  function submitCode() {
    if (code.length !== 6) return toast.error('Enter the complete six-digit booth code');
    void openBooth({ code });
  }

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}><ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
    <View className="px-5 pb-4 pt-3"><Text className="text-[30px] font-black text-black">Open a booth</Text><Text className="mt-1 text-sm leading-5 text-[#666]">Scan the official QR or enter the booth’s six-digit access code.</Text></View>
    <View className="mx-5 flex-row rounded-2xl bg-white p-1.5"><ModeButton active={mode === 'scan'} icon="scan-outline" label="Scan QR" onPress={() => setMode('scan')} /><ModeButton active={mode === 'code'} icon="keypad-outline" label="Enter code" onPress={() => { requestLocked.current = false; setMode('code'); }} /></View>
    {mode === 'scan' ? <View className="mx-5 mt-4 rounded-[24px] bg-white p-3"><BoothScanner busy={resolve.isPending} onScan={(credential) => void openBooth(credential)} onUseCode={() => setMode('code')} /><View className="flex-row gap-3 px-2 pb-1 pt-4"><Ionicons name="qr-code-outline" size={20} color="#111" /><View className="flex-1"><Text className="text-sm font-bold">Position the QR inside the frame</Text><Text className="mt-1 text-xs leading-5 text-[#777]">Scanning starts automatically when the camera is ready.</Text></View></View></View> : <View className="mx-5 mt-4 rounded-[24px] bg-white p-5"><View className="h-12 w-12 items-center justify-center rounded-full bg-hook/20"><Ionicons name="keypad-outline" size={23} color="#111" /></View><Text className="mt-5 text-xl font-black">Enter booth code</Text><Text className="mt-2 text-sm leading-5 text-[#666]">Paste or type the six digits displayed at the booth. Spaces are removed automatically.</Text><TextInput value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} onSubmitEditing={submitCode} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} placeholder="000000" editable={!resolve.isPending} className="mt-6 h-16 rounded-2xl border border-black/10 bg-[#fafafa] px-4 text-center text-2xl font-black tracking-[10px] text-black" /><Text className="mt-2 text-right text-xs font-medium text-[#888]">{code.length}/6 digits</Text><Pressable disabled={code.length !== 6 || resolve.isPending} onPress={submitCode} className={`mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl ${code.length === 6 && !resolve.isPending ? 'bg-hook' : 'bg-hook/30'}`}>{resolve.isPending ? <HookLoader size="button" /> : <><Text className="font-black">Open booth</Text><Ionicons name="arrow-forward" size={19} /></>}</Pressable></View>}
  </ScrollView></KeyboardAvoidingView>;
}

function ModeButton({ active, icon, label, onPress }: { active: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl ${active ? 'bg-hook' : ''}`} accessibilityRole="tab" accessibilityState={{ selected: active }}><Ionicons name={icon} size={18} color={active ? '#111' : '#777'} /><Text className={`text-sm font-bold ${active ? 'text-black' : 'text-[#777]'}`}>{label}</Text></Pressable>;
}
