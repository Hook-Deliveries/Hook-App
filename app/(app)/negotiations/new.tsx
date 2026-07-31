import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { HookLoader } from "@/components/shared/HookLoader";
import { toast } from "@/components/shared/toast";
import {
  useCounterNegotiationMutation,
  useStartNegotiationMutation,
} from "@/lib/mobile-api";

export default function NewNegotiationScreen() {
  const params = useLocalSearchParams<{
    productId: string;
    variantId: string;
    quantity: string;
  }>();
  const start = useStartNegotiationMutation();
  const offer = useCounterNegotiationMutation();
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<any>();
  async function submit() {
    const value = Math.round(Number(amount.replace(/,/g, "")) * 100);
    if (!value) return toast.error("Enter your offer");
    try {
      let negotiationId = result?.negotiationId;
      if (!negotiationId) {
        const created = (await start.mutateAsync({
          productId: params.productId,
          variantId: params.variantId,
          quantity: Number(params.quantity || 1),
        })) as any;
        negotiationId = created.negotiationId;
      }
      const response = (await offer.mutateAsync({
        negotiationId,
        offeredPrice: value,
      })) as any;
      setResult({ ...response, negotiationId });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Offer could not be processed",
      );
    }
  }
  return (
    <View className="flex-1 justify-center bg-[#f4f4f5] px-5">
      <Text className="text-[30px] font-black">Make your offer</Text>
      <Text className="mt-2 text-sm leading-5 text-[#666]">
        Hook’s pricing engine makes every decision. AI only helps phrase the
        response.
      </Text>
      <View className="mt-7 rounded-[24px] bg-white p-5">
        <Text className="text-xs font-bold uppercase text-[#777]">
          Your price in naira
        </Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="₦0"
          className="mt-3 h-16 border-b border-black/10 text-3xl font-black"
        />
        {result ? (
          <View className="mt-5 rounded-2xl bg-[#fff7d2] p-4">
            <Text className="font-black">{result.decision}</Text>
            <Text className="mt-2 text-sm leading-5 text-[#555]">
              {result.message}
            </Text>
            {result.counterPriceMinor ? (
              <Text className="mt-3 text-xl font-black">
                ₦{(result.counterPriceMinor / 100).toLocaleString()}
              </Text>
            ) : null}
          </View>
        ) : null}
        <Pressable
          disabled={start.isPending || offer.isPending}
          onPress={() => void submit()}
          className="mt-5 h-14 items-center justify-center rounded-2xl bg-hook"
        >
          {start.isPending || offer.isPending ? (
            <HookLoader size="button" />
          ) : (
            <Text className="font-black">Send offer</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          className="mt-3 h-12 items-center justify-center"
        >
          <Text className="font-bold text-[#666]">Close</Text>
        </Pressable>
      </View>
    </View>
  );
}
