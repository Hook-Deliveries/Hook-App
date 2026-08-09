import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile/ProfileComponents';
import { HookLoader } from '@/components/shared/HookLoader';
import { toast } from '@/components/shared/toast';
import { getProfile, updateProfile } from '@/lib/auth-api';
import { getSession, saveSession } from '@/lib/session';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', avatarUrl: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { void getProfile().then((user) => setForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '', email: user.email, avatarUrl: user.avatarUrl || '' })).catch((error) => toast.error('Profile unavailable', error instanceof Error ? error.message : 'Please try again.')); }, []);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) return toast.error('Name required', 'Enter your first and last name.');
    setBusy(true);
    try {
      const user = await updateProfile(form);
      const session = await getSession();
      if (session) await saveSession({ ...session, user: { ...session.user, ...user } });
      toast.success('Profile updated', 'Your account details are up to date.');
      router.back();
    } catch (error) { toast.error('Could not update profile', error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); }
  }
  const name = `${form.firstName} ${form.lastName}`.trim();
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#F5F5F5]"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: 40 }}>
    <View className="flex-row items-center justify-between"><Pressable accessibilityLabel="Back" onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white"><Ionicons name="chevron-back" size={22} /></Pressable><Text className="text-lg font-bold">Edit profile</Text><View className="w-11" /></View>
    <View className="mt-7 items-center rounded-[18px] bg-[#FFF4C7] py-7"><ProfileAvatar name={name} uri={form.avatarUrl} size={88} /><Text className="mt-3 text-sm font-bold">Profile photo</Text></View>
    <View className="mt-4 rounded-[14px] bg-white p-4"><Field label="First name" value={form.firstName} onChangeText={(v) => update('firstName', v)} /><Field label="Last name" value={form.lastName} onChangeText={(v) => update('lastName', v)} /><Field label="Phone number" value={form.phone} keyboardType="phone-pad" onChangeText={(v) => update('phone', v)} /><Field label="Email" value={form.email} editable={false} /></View>
    <Pressable disabled={busy} onPress={save} className="mt-6 h-[54px] items-center justify-center rounded-full bg-hook">{busy ? <HookLoader size="button" variant="dark" /> : <Text className="font-black text-black">Save changes</Text>}</Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) { const { label, ...input } = props; return <View className="mb-4"><Text className="mb-2 text-xs font-bold text-[#777]">{label}</Text><TextInput {...input} className={`h-[52px] rounded-[12px] bg-[#F5F5F5] px-4 text-[15px] text-black ${input.editable === false ? 'opacity-60' : ''}`} /></View>; }
