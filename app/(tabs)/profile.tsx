import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { useAuthSheet } from "@/components/auth/AuthSheetProvider";
import { ProfileAvatar, ProfileRow, ProfileSection } from "@/components/profile/ProfileComponents";
import { HookConfirmSheet } from "@/components/shared/HookConfirmSheet";
import { HookYellowPattern } from "@/components/marketplace/HookYellowPattern";
import { ScallopedEdge } from "@/components/marketplace/ScallopedEdge";
import { logout, useLocalSessionQuery } from "@/lib/auth-api";
import { unregisterPushToken } from "@/lib/push";
import { clearSession } from "@/lib/session";
import { toast } from "@/components/shared/toast";

type QuickActionProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
};

function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-[92px] flex-1 items-center justify-center rounded-[20px] bg-white px-2"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#FFF1B8]">
        <Ionicons name={icon} size={20} color="#111" />
      </View>
      <Text className="mt-2 text-center text-[12px] font-bold text-[#232326]">
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const local = useLocalSessionQuery();
  const { refetch } = local;
  const { openAuth } = useAuthSheet();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const session = local.data?.session;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const expandedHeaderStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 130], [244, 118], Extrapolation.CLAMP),
  }));
  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 82], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 120], [0, -12], Extrapolation.CLAMP) }],
  }));
  const compactHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [72, 126], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [72, 126], [-12, 0], Extrapolation.CLAMP) }],
  }));

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F1F1F3] px-6">
        <View className="absolute inset-x-0 top-0 h-[300px] overflow-hidden bg-[#FFD93E]">
          <HookYellowPattern />
          <ScallopedEdge color="#FFD93E" zIndex={2} />
        </View>
        <View className="w-full items-center rounded-[28px] bg-white px-6 pb-7 pt-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-hook">
            <Text className="text-2xl font-black text-black">H</Text>
          </View>
          <Text className="mt-5 text-center text-[25px] font-black text-black">
            Your Hook profile
          </Text>
          <Text className="mt-2 text-center text-[14px] leading-5 text-[#6F6F72]">
            Sign in to manage orders, addresses and saved products.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => openAuth("/(tabs)/profile")}
            className="mt-6 h-[52px] w-full items-center justify-center rounded-full bg-hook"
          >
            <Text className="font-black text-black">Sign in or create account</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const name = `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Hook customer";

  async function handleLogout() {
    if (!session) return;
    setLogoutBusy(true);
    await Promise.allSettled([
      logout(session.refreshToken),
      unregisterPushToken(),
    ]);
    await clearSession();
    setLogoutBusy(false);
    setLogoutOpen(false);
    toast.success("You are signed out", "Sign in again to continue shopping.");
    router.replace("/(tabs)");
    setTimeout(() => openAuth(), 320);
  }

  return (
    <>
      <Animated.ScrollView
        className="flex-1 bg-[#F1F1F3]"
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={local.isRefetching}
            onRefresh={() => void refetch()}
            tintColor="#111"
            colors={["#111"]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 112 }}
      >
        <Animated.View className="relative overflow-hidden bg-[#FFD93E]" style={expandedHeaderStyle}>
          <HookYellowPattern />
          <Animated.View
            className="flex-row items-center justify-between px-5"
            style={[{ paddingTop: insets.top + 10 }, expandedContentStyle]}
          >
            <View>
              <Text className="text-[12px] font-black uppercase tracking-[1.4px] text-[#715C00]">
                Hook account
              </Text>
              <Text className="mt-1 text-[28px] font-black text-black">Profile</Text>
            </View>
            <Pressable
              accessibilityLabel="Edit profile"
              onPress={() => router.push("/profile/edit" as never)}
              className="h-11 w-11 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="create-outline" size={20} color="#111" />
            </Pressable>
          </Animated.View>
          <ScallopedEdge color="#FFD93E" zIndex={3} />
        </Animated.View>

        <View
          className="mx-4 -mt-[70px] rounded-[26px] bg-white px-4 py-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <View className="flex-row items-center">
            <View className="rounded-full border-4 border-[#FFF1B8]">
              <ProfileAvatar name={name} uri={session.user.avatarUrl} size={74} />
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="flex-shrink text-[19px] font-black text-black">
                {name}
              </Text>
              <Text className="flex-shrink mt-1 text-[13px] text-[#77777B]">
                {session.user.email}
              </Text>
              <View className="mt-2 self-start rounded-full bg-[#EAF8EE] px-2.5 py-1">
                <Text className="text-[10px] font-black text-[#278044]">
                  {session.user.isEmailVerified ? "Verified account" : "Complete your account"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2 px-4">
          <QuickAction icon="cube-outline" label="Orders" onPress={() => router.push("/(tabs)/orders" as never)} />
          <QuickAction icon="heart-outline" label="Saved" onPress={() => router.push("/likes" as never)} />
          <QuickAction icon="location-outline" label="Addresses" onPress={() => router.push("/addresses" as never)} />
        </View>

        <View className="px-4">
          <ProfileSection title="Security">
            <ProfileRow icon="lock-closed-outline" label="Password & biometrics" onPress={() => router.push("/profile/security" as never)} />
            <ProfileRow icon="phone-portrait-outline" label="Your devices" onPress={() => router.push("/profile/devices" as never)} />
          </ProfileSection>
          <ProfileSection title="Support and legal">
            <ProfileRow icon="help-circle-outline" label="Help & support" />
            <ProfileRow icon="document-text-outline" label="Terms & privacy" />
          </ProfileSection>
          <ProfileSection title="App information">
            <ProfileRow icon="information-circle-outline" label="App version" value={Constants.expoConfig?.version || "1.0.0"} />
            <ProfileRow icon="star-outline" label="Rate this app" />
          </ProfileSection>
          <ProfileSection title="Account access">
            <ProfileRow icon="log-out-outline" label="Log out" danger onPress={() => setLogoutOpen(true)} />
          </ProfileSection>
        </View>
      </Animated.ScrollView>
      <Animated.View
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0 z-30 overflow-hidden border-b border-black/5 bg-[#FFD93E]"
        style={[{ paddingTop: insets.top, height: insets.top + 68 }, compactHeaderStyle]}
      >
        <HookYellowPattern opacity={0.7} />
        <View className="relative z-10 flex-1 flex-row items-center justify-between px-5">
          <Text className="text-xl font-black text-black">Profile</Text>
          <Pressable
            accessibilityLabel="Edit profile"
            onPress={() => router.push("/profile/edit" as never)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="create-outline" size={18} color="#111" />
          </Pressable>
        </View>
      </Animated.View>
      <HookConfirmSheet
        visible={logoutOpen}
        title="Log out of Hook?"
        message="You can sign back in anytime. This will end the current session on this device."
        icon="log-out-outline"
        confirmLabel="Log out"
        destructive
        busy={logoutBusy}
        onClose={() => {
          if (!logoutBusy) setLogoutOpen(false);
        }}
        onConfirm={handleLogout}
      />
    </>
  );
}
