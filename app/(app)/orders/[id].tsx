import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HookLoader } from "@/components/shared/HookLoader";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { useOrderQuery } from "@/lib/mobile-api";
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const query = useOrderQuery(id);
  const order = query.data as any;
  if (query.isLoading)
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f4f5]">
        <HookLoader label="Loading Order" />
      </View>
    );
  if (!order)
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="font-black">Order unavailable</Text>
      </View>
    );
  return (
    <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="arrow-back" size={21} />
        </Pressable>
        <View>
          <Text className="text-xl font-black">{order.id}</Text>
          <Text className="text-xs text-[#777]">
            {String(order.commerceStatus || order.status).replaceAll("_", " ")}
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 30,
        }}
      >
        <View className="rounded-[22px] bg-black p-5">
          <Text className="text-xs font-bold uppercase text-white/50">
            Total
          </Text>
          <Text className="mt-2 text-3xl font-black text-white">
            ₦{(Number(order.totalMinor || 0) / 100).toLocaleString()}
          </Text>
          <Text className="mt-2 text-sm text-hook">
            {String(order.commercePaymentStatus || "").replaceAll("_", " ")}
          </Text>
        </View>
        <View className="mt-4 gap-3">
          {order.items?.map((item: any) => (
            <View
              key={item.id}
              className="flex-row gap-3 rounded-[20px] bg-white p-3"
            >
              <View className="h-20 w-20 overflow-hidden rounded-2xl bg-[#eee]">
                <RemoteImage
                  uri={item.productSnapshot?.image || item.productImage}
                />
              </View>
              <View className="flex-1">
                <Text className="font-black">
                  {item.productSnapshot?.title || item.productTitle}
                </Text>
                <Text className="mt-1 text-xs text-[#777]">
                  Quantity {item.quantity}
                </Text>
                <Text className="mt-2 font-black">
                  ₦{(Number(item.totalPriceMinor || 0) / 100).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
