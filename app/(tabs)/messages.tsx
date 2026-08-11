import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getHookTabBarContentInset } from "@/components/tab-bar/layout";
import { HookBackButton } from "@/components/shared/HookBackButton";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F1F1F3]" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4">
        <View className="flex-row items-center justify-between">
          <HookBackButton />
          <Text className="text-[22px] font-black text-[#0A0A0A]">Messages</Text>
          <View className="rounded-full bg-[#FFF3C4] px-3 py-1.5">
            <Text className="text-[10px] font-bold text-[#8A6500]">Coming soon</Text>
          </View>
        </View>

        <View className="mt-8 h-[52px] flex-row items-center rounded-full border border-[#F2F2F2] bg-white px-3">
          <Ionicons name="search" size={23} color="#A5A5A8" />
          <TextInput
            editable={false}
            accessibilityLabel="Search conversations"
            placeholder="Search conversations..."
            placeholderTextColor="rgba(10,10,10,0.45)"
            className="ml-2 flex-1 text-[14px] text-black"
          />
        </View>
      </View>

      <View
        className="mt-8 flex-1 items-center border-t border-[#F3F4F6] bg-white px-8 pt-20"
        style={{ paddingBottom: getHookTabBarContentInset(insets.bottom) }}
      >
        <View className="relative h-24 w-24 items-center justify-center rounded-[28px] bg-hook">
          <Ionicons name="chatbubble-ellipses" size={39} color="#111" />
          <View className="absolute -right-2 -top-2 h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-black">
            <Ionicons name="sparkles" size={15} color="#FFC809" />
          </View>
        </View>
        <Text className="mt-7 text-center text-[23px] font-black text-[#0A0A0A]">AI conversations are coming soon</Text>
        <Text className="mt-3 max-w-[310px] text-center text-[14px] leading-6 text-[#77777B]">Negotiate eligible product prices and keep every Hook conversation organized in one secure place.</Text>
        <View className="mt-7 flex-row items-center rounded-full bg-[#FFF9E0] px-4 py-2.5">
          <Ionicons name="shield-checkmark" size={16} color="#8A6500" />
          <Text className="ml-2 text-[12px] font-bold text-[#8A6500]">Powered by Hook AI</Text>
        </View>
      </View>
    </View>
  );
}
