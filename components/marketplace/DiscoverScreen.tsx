import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-[#F1F1F3]"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="px-4">
        <Text className="text-[30px] font-black text-black">Discover</Text>
      </View>

      <View className="flex-1 items-center justify-center px-8 pb-20">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FFC809]">
          <Ionicons name="sparkles-outline" size={28} color="#111" />
        </View>
        <Text className="mt-5 text-lg font-black text-black">Coming soon</Text>
        <Text className="mt-2 max-w-[290px] text-center text-sm leading-5 text-[#777]">
          We are preparing a better way to discover what is happening on Hook.
        </Text>
      </View>
    </View>
  );
}
