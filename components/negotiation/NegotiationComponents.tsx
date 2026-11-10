import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { RemoteImage } from "@/components/shared/RemoteImage";
import type { PublicCatalogProduct } from "@/lib/mobile-api";

export const negotiationMoney = (minor = 0) =>
  `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

export function NegotiationProductSummary({
  product,
  quantity,
  onQuantity,
  onPreview,
  status,
  peopleNegotiating,
  imageUrl,
  unitPriceMinor,
  maxQuantity = 20,
}: {
  product?: PublicCatalogProduct;
  quantity: number;
  onQuantity: (value: number) => void;
  onPreview: () => void;
  status?: string;
  peopleNegotiating?: number;
  imageUrl?: string;
  /** The customer's locked price per item; the normal price is struck through beside it. */
  unitPriceMinor?: number;
  maxQuantity?: number;
}) {
  const listUnit = product?.effectivePriceMinor || 0;
  const unit = unitPriceMinor ?? listUnit;
  return (
    <View className="mx-4 mb-3 rounded-[20px] bg-white p-2.5">
      <View className="mb-3 flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-1">
          <Ionicons name="location" size={14} color="#111" />
          <Text
            numberOfLines={1}
            className="text-[11px] font-bold uppercase text-black"
          >
            {product?.market?.name || "Hook Market"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/checkout")}
          className="h-9 justify-center rounded-full bg-hook px-3"
        >
          <Text className="text-[11px] font-bold">Proceed to checkout</Text>
        </Pressable>
      </View>
      <View className="flex-row items-center gap-3 rounded-2xl bg-[#F1F1F3] p-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview product"
          onPress={onPreview}
          className="overflow-hidden rounded-xl bg-white"
          style={{ width: 64, height: 64, flexShrink: 0 }}
        >
          <RemoteImage uri={product?.media.find((item) => item.type === 'image' && item.url)?.url || imageUrl} contentFit="cover" />
        </Pressable>
        <View className="min-w-0 flex-1 gap-2">
          <Text numberOfLines={2} className="text-sm font-bold">
            {product?.title || "Loading product"}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityLabel="Decrease quantity"
              disabled={quantity <= 1}
              onPress={() => onQuantity(quantity - 1)}
              className="size-7 items-center justify-center rounded-full bg-black disabled:opacity-40"
            >
              <Ionicons name="remove" size={16} color="white" />
            </Pressable>
            <Text className="text-sm">{quantity}</Text>
            <Pressable
              accessibilityLabel="Increase quantity"
              disabled={quantity >= maxQuantity}
              onPress={() => onQuantity(quantity + 1)}
              className="size-7 items-center justify-center rounded-full bg-black disabled:opacity-40"
            >
              <Ionicons name="add" size={16} color="white" />
            </Pressable>
          </View>
        </View>
        <View className="items-end gap-1">
          <Text className="text-[10px] text-[#666]">{status || "Ready"}</Text>
          {peopleNegotiating ? (
            <Text className="text-[10px] text-[#287B35]">
              {peopleNegotiating} negotiating
            </Text>
          ) : null}
          <Text className="text-sm font-black">
            {negotiationMoney(unit * quantity)}
          </Text>
          {unitPriceMinor !== undefined && unitPriceMinor < listUnit ? (
            <Text className="text-[10px] text-[#999] line-through">{negotiationMoney(listUnit * quantity)}</Text>
          ) : null}
          <Text className="text-[10px] text-[#666]">
            {negotiationMoney(unit)} each
          </Text>
        </View>
      </View>
    </View>
  );
}
