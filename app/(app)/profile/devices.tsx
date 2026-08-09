import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HookLoader } from '@/components/shared/HookLoader';
import { toast } from '@/components/shared/toast';
import { listDevices, revokeDevice, revokeOtherDevices } from '@/lib/auth-api';

export default function DevicesScreen() {
  const insets = useSafeAreaInsets(); const client = useQueryClient();
  const query = useQuery({ queryKey: ['account', 'devices'], queryFn: listDevices });
  const revoke = useMutation({ mutationFn: revokeDevice, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['account', 'devices'] }); toast.success('Device removed', 'That device has been signed out.'); }, onError: (error) => toast.error('Could not remove device', error instanceof Error ? error.message : 'Please try again.') });
  const revokeOthers = useMutation({ mutationFn: revokeOtherDevices, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['account', 'devices'] }); toast.success('Other devices signed out', 'This device remains connected.'); } });
  return <ScrollView className="flex-1 bg-[#F5F5F5]" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: 40 }}><View className="flex-row items-center"><Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full bg-white"><Ionicons name="chevron-back" size={22} /></Pressable><View className="ml-4"><Text className="text-xl font-black">Your devices</Text><Text className="mt-0.5 text-xs text-[#777]">Manage where your Hook account is signed in.</Text></View></View>
    {query.isLoading ? <View className="py-24"><HookLoader /></View> : <View className="mt-6 overflow-hidden rounded-[14px] bg-white">{query.data?.map((device, index) => { const deviceId = device.id || device.deviceId; return <View key={deviceId || `device-${index}`} className="flex-row items-center border-b border-black/5 p-4 last:border-b-0"><View className="h-11 w-11 items-center justify-center rounded-[11px] bg-[#FFF4C7]"><Ionicons name={device.platform === 'ios' ? 'logo-apple' : device.platform === 'android' ? 'logo-android' : 'phone-portrait-outline'} size={21} /></View><View className="ml-3 flex-1"><View className="flex-row items-center"><Text className="font-bold">{device.deviceName}</Text>{device.current ? <View className="ml-2 rounded-full bg-[#FFF4C7] px-2 py-0.5"><Text className="text-[10px] font-bold">This device</Text></View> : null}</View><Text className="mt-1 text-xs text-[#777]">Last active {new Date(device.lastActiveAt).toLocaleDateString()}</Text></View>{!device.current ? <Pressable disabled={revoke.isPending || !deviceId} onPress={() => { if (deviceId) revoke.mutate(deviceId); }} className="h-9 items-center justify-center rounded-full bg-red-50 px-3"><Text className="text-xs font-bold text-red-600">Sign out</Text></Pressable> : null}</View>; })}</View>}
    {(query.data?.filter((item) => !item.current).length || 0) > 0 ? <Pressable disabled={revokeOthers.isPending} onPress={() => revokeOthers.mutate()} className="mt-5 h-[52px] items-center justify-center rounded-full bg-black"><Text className="font-bold text-white">Sign out all other devices</Text></Pressable> : null}
  </ScrollView>;
}
