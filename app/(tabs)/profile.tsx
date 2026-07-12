import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useLocalSessionQuery, useLogoutMutation } from '@/lib/auth-api';
import { unregisterPushToken } from '@/lib/push';
import {
  clearGuestId,
  clearSession,
} from '@/lib/session';
import { toast } from '@/components/shared/toast';
import { HookLoader } from '@/components/shared/HookLoader';
import { BottomSheetModal } from '@/components/shared/BottomSheetModal';

export default function ProfileScreen() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const queryClient = useQueryClient();
  const localSession = useLocalSessionQuery();
  const { refetch } = localSession;
  const logout = useLogoutMutation();
  const session = localSession.data?.session ?? null;
  const guestId = localSession.data?.guestId ?? null;
  const busy = logout.isPending;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  async function handleLogout() {
    try {
      const refreshToken = session?.refreshToken;
      if (refreshToken) {
        await logout.mutateAsync(refreshToken);
      }
      await unregisterPushToken();
      await clearSession();
      await clearGuestId();
      queryClient.removeQueries({ queryKey: ['auth', 'local-session'] });
      setShowLogoutConfirm(false);
      toast.success('Logged out', 'See you soon.');
      router.replace('/auth');
    } catch (error) {
      toast.error('Logout failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  const displayName = session?.user
    ? `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.email
    : 'Guest shopper';

  return (
    <View className="flex-1 bg-hook-surface px-5 pt-16">
      <Text className="text-[32px] font-bold text-black">Profile</Text>
      <Text className="mt-2 text-base text-hook-text">
        {session ? 'Manage your Hook account.' : 'You are shopping as a guest.'}
      </Text>

      <View className="mt-8 rounded-[22px] bg-white p-5">
        <Text className="text-lg font-semibold text-black">{displayName}</Text>
        <Text className="mt-1 text-sm text-hook-text">
          {session?.user.email || `Guest ID: ${guestId || 'not set'}`}
        </Text>
      </View>

      {!session ? (
        <Pressable
          className="mt-6 h-[52px] items-center justify-center rounded-full bg-hook"
          onPress={() => router.push('/auth')}>
          <Text className="text-sm font-medium text-black">Create account</Text>
        </Pressable>
      ) : null}

      <Pressable
        className="mt-3 h-[52px] items-center justify-center rounded-full bg-black"
        disabled={busy}
        onPress={() => setShowLogoutConfirm(true)}>
        {busy ? <HookLoader size="button" variant="yellow" /> : <Text className="text-sm font-medium text-white">Logout</Text>}
      </Pressable>

      <BottomSheetModal
        accessibilityLabel="Logout confirmation"
        dismissible={!busy}
        onClose={() => setShowLogoutConfirm(false)}
        title="Log out?"
        visible={showLogoutConfirm}
      >
        <View className="items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-hook/20">
            <Ionicons name="log-out-outline" size={24} color="#111111" />
          </View>
          <Text className="mt-4 max-w-[320px] text-center text-[15px] leading-6 text-hook-text">
            Are you sure you want to log out of Hook? You can sign back in anytime.
          </Text>
        </View>

        <View className="mt-6 gap-3">
          <Pressable
            accessibilityRole="button"
            className={`h-[52px] items-center justify-center rounded-full ${busy ? 'bg-black/60' : 'bg-black'}`}
            disabled={busy}
            onPress={handleLogout}>
            {busy ? <HookLoader size="button" variant="yellow" /> : <Text className="text-sm font-semibold text-white">Yes, log out</Text>}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="h-[52px] items-center justify-center rounded-full bg-hook-surface"
            disabled={busy}
            onPress={() => setShowLogoutConfirm(false)}>
            <Text className="text-sm font-semibold text-black">Stay signed in</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </View>
  );
}
