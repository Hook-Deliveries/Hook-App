import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { HookLoader } from "@/components/shared/HookLoader";
import { usePaymentStatusQuery } from "@/lib/mobile-api";
export default function PaymentStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = usePaymentStatusQuery(id);
  const status = (query.data as any)?.payment?.status;
  return (
    <View className="flex-1 items-center justify-center bg-[#f4f4f5] px-8">
      {query.isLoading ? (
        <HookLoader label="Checking payment" />
      ) : (
        <>
          <Text className="text-2xl font-black">
            {status === "CONFIRMED"
              ? "Payment confirmed"
              : status === "FAILED"
                ? "Payment failed"
                : "Payment processing"}
          </Text>
          <Text className="mt-3 text-center text-sm leading-5 text-[#777]">
            {status === "CONFIRMED"
              ? "Your Order is approved for fulfilment."
              : "We only confirm payments after verified Paystack evidence."}
          </Text>
          <Pressable
            onPress={() =>
              router.replace({
                pathname: "/orders/[id]",
                params: { id },
              } as never)
            }
            className="mt-6 rounded-full bg-hook px-6 py-3"
          >
            <Text className="font-black">View Order</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
