import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useLocalSessionQuery, useLogoutMutation } from "@/lib/auth-api";
import { unregisterPushToken } from "@/lib/push";
import { clearGuestId, clearSession } from "@/lib/session";
import { toast } from "@/components/shared/toast";
import { HookLoader } from "@/components/shared/HookLoader";
import { HookConfirmSheet } from "@/components/shared/HookConfirmSheet";

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
      queryClient.removeQueries({ queryKey: ["auth", "local-session"] });
      setShowLogoutConfirm(false);
      toast.success("Logged out", "See you soon.");
      router.replace("/auth");
    } catch (error) {
      toast.error(
        "Logout failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  const displayName = session?.user
    ? `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() ||
      session.user.email
    : "Guest shopper";

  return (
    <View className="flex-1 bg-hook-surface px-5 pt-16">
      <Text className="text-[32px] font-bold text-black">Profile</Text>
      <Text className="mt-2 text-base text-hook-text">
        {session ? "Manage your Hook account." : "You are shopping as a guest."}
      </Text>

      <View className="mt-8 rounded-[22px] bg-white p-5">
        <Text className="text-lg font-semibold text-black">{displayName}</Text>
        <Text className="mt-1 text-sm text-hook-text">
          {session?.user.email || `Guest ID: ${guestId || "not set"}`}
        </Text>
      </View>

      {!session ? (
        <Pressable
          className="mt-6 h-[52px] items-center justify-center rounded-full bg-hook"
          onPress={() => router.push("/auth")}
        >
          <Text className="text-sm font-medium text-black">Create account</Text>
        </Pressable>
      ) : null}

      {session ? (
        <Pressable
          className="mt-6 h-[52px] flex-row items-center justify-between rounded-full bg-white px-5"
          onPress={() => router.push("/likes" as never)}
        >
          <View className="flex-row items-center">
            <Ionicons name="heart-outline" size={20} color="#111" />
            <Text className="ml-3 text-sm font-semibold text-black">
              Saved products
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </Pressable>
      ) : null}

      <Pressable
        className="mt-3 h-[52px] items-center justify-center rounded-full bg-black"
        disabled={busy}
        onPress={() => setShowLogoutConfirm(true)}
      >
        {busy ? (
          <HookLoader size="button" variant="yellow" />
        ) : (
          <Text className="text-sm font-medium text-white">Logout</Text>
        )}
      </Pressable>

      <HookConfirmSheet
        icon="log-out-outline"
        title="Log out?"
        visible={showLogoutConfirm}
        message="Are you sure you want to log out of Hook? You can sign back in anytime."
        confirmLabel="Yes, log out"
        cancelLabel="Stay signed in"
        busy={busy}
        onConfirm={handleLogout}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </View>
  );
}
