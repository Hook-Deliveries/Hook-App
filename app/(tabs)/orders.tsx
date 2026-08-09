import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HookLoader } from "@/components/shared/HookLoader";
import { useCustomerSessionQuery, useOrdersQuery } from "@/lib/mobile-api";
import { isCustomerSession } from "@/lib/session";
import { useAuthSheet } from "@/components/auth/AuthSheetProvider";
export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const query = useOrdersQuery();
  const session = useCustomerSessionQuery();
  const { openAuth } = useAuthSheet();
  const orders = (query.data as any[]) || [];
  if (!session.isPending && !isCustomerSession(session.data)) return (
    <View className="flex-1 items-center justify-center bg-[#f4f4f5] px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-[#fff4c7]"><Ionicons name="cube-outline" size={36} /></View>
      <Text className="mt-5 text-xl font-black">Sign in to track orders</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-[#777]">Your local cart stays ready while you sign in or create an account.</Text>
      <Pressable onPress={() => openAuth("/(tabs)/orders")} className="mt-6 h-[52px] w-full items-center justify-center rounded-full bg-hook"><Text className="font-bold text-black">Continue</Text></Pressable>
    </View>
  );
  if (query.isLoading || session.isPending)
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f4f5]">
        <HookLoader label="Loading Orders" />
      </View>
    );
  return (
    <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-4 pt-3">
        <Text className="text-[30px] font-black">Orders</Text>
        <Text className="mt-1 text-sm text-[#777]">
          Payments, approval and delivery readiness
        </Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
            tintColor="#111"
          />
        }
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: insets.bottom + 110,
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/orders/[id]",
                params: { id: item.id },
              } as never)
            }
            className="rounded-[22px] bg-white p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-black">{item.id}</Text>
              <View className="rounded-full bg-hook/20 px-3 py-1.5">
                <Text className="text-[10px] font-bold uppercase">
                  {String(item.commerceStatus || item.status).replaceAll(
                    "_",
                    " ",
                  )}
                </Text>
              </View>
            </View>
            <View className="mt-4 flex-row items-end justify-between">
              <View>
                <Text className="text-xs text-[#888]">
                  {item.channel === "PARTNER_ASSISTED"
                    ? "Partner assisted"
                    : "Shopper App"}
                </Text>
                <Text className="mt-1 text-xs text-[#888]">
                  {item.commercePaymentMethod === "PAY_AT_HANDOVER"
                    ? "Pay at handover"
                    : "Prepaid"}
                </Text>
              </View>
              <Text className="text-xl font-black">
                ₦
                {(
                  Number(item.totalMinor || item.total * 100 || 0) / 100
                ).toLocaleString()}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="mt-28 items-center px-8">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-[#fff4c7]">
              <Ionicons name="cube-outline" size={38} />
            </View>
            <Text className="mt-5 text-xl font-black">No Orders yet</Text>
            <Text className="mt-2 text-center text-sm text-[#777]">
              Your orders and delivery progress will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
