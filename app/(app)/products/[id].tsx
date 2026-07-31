import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CartButton } from "@/components/features/cart/CartButton";
import { HookLoader } from "@/components/shared/HookLoader";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { toast } from "@/components/shared/toast";
import { useAddCartItemMutation, useProductQuery } from "@/lib/mobile-api";

const width = Dimensions.get("window").width;
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const query = useProductQuery(id);
  const add = useAddCartItemMutation();
  const product = query.data;
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState<string>();
  const variants = product?.variants || [];
  const selectedVariant =
    variants.find((item) => item.publicId === variantId) || variants[0];
  const images = useMemo(() => product?.media || [], [product?.media]);
  async function addToCart() {
    if (!product || !selectedVariant)
      return toast.error("Choose a product option");
    try {
      await add.mutateAsync({
        productId: product.publicId,
        variantId: selectedVariant.publicId,
        quantity,
        selectedVariants: {
          color: selectedVariant.colour,
          size: selectedVariant.size,
        },
      });
      toast.success("Added to basket");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add product",
      );
    }
  }
  if (query.isLoading)
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <HookLoader label="Loading product" />
      </View>
    );
  if (!product)
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="font-black">Product unavailable</Text>
      </View>
    );
  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-[#f4f4f5]"
          >
            <Ionicons name="arrow-back" size={21} />
          </Pressable>
          <CartButton tone="white" />
        </View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {images.map((image) => (
            <View
              key={image.url}
              style={{ width, height: 360 }}
              className="bg-[#f5f5f6]"
            >
              <RemoteImage uri={image.url} />
            </View>
          ))}
        </ScrollView>
        <View className="px-5 pt-6">
          <Text className="text-[28px] font-black leading-8">
            {product.title}
          </Text>
          <Text className="mt-2 text-2xl font-black">
            ₦{(product.effectivePriceMinor / 100).toLocaleString()}
          </Text>
          {product.discountMinor ? (
            <Text className="mt-1 text-sm text-[#888] line-through">
              ₦{(product.sellingPriceMinor / 100).toLocaleString()}
            </Text>
          ) : null}
          <View className="mt-5 flex-row items-center justify-between">
            <Text className="font-black">Quantity</Text>
            <View className="flex-row items-center rounded-full bg-[#f4f4f5] p-1">
              <Pressable
                disabled={quantity === 1}
                onPress={() => setQuantity((value) => value - 1)}
                className="h-9 w-9 items-center justify-center rounded-full bg-white"
              >
                <Ionicons name="remove" size={17} />
              </Pressable>
              <Text className="w-10 text-center font-black">{quantity}</Text>
              <Pressable
                disabled={quantity === 20}
                onPress={() => setQuantity((value) => value + 1)}
                className="h-9 w-9 items-center justify-center rounded-full bg-white"
              >
                <Ionicons name="add" size={17} />
              </Pressable>
            </View>
          </View>
          {variants.length ? (
            <View className="mt-6">
              <Text className="font-black">Options</Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {variants.map((variant) => (
                  <Pressable
                    key={variant.publicId}
                    onPress={() => setVariantId(variant.publicId)}
                    className={`rounded-full border px-4 py-3 ${selectedVariant?.publicId === variant.publicId ? "border-black bg-black" : "border-black/10"}`}
                  >
                    <Text
                      className={`text-xs font-bold ${selectedVariant?.publicId === variant.publicId ? "text-white" : ""}`}
                    >
                      {[variant.colour, variant.size]
                        .filter(Boolean)
                        .join(" · ") || "Default"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <View className="mt-7 border-t border-black/5 pt-6">
            <Text className="text-lg font-black">About this product</Text>
            <Text className="mt-3 text-sm leading-6 text-[#555]">
              {product.description || "Commercially reviewed by Hook."}
            </Text>
            <Text className="mt-5 text-xs text-[#888]">
              Sourced from {product.market?.name || "a verified Hook Market"}.
            </Text>
          </View>
        </View>
      </ScrollView>
      <View
        className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-black/5 bg-white px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        {product.negotiationAvailable && selectedVariant ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/negotiations/new",
                params: {
                  productId: product.publicId,
                  variantId: selectedVariant.publicId,
                  quantity,
                },
              } as never)
            }
            className="h-14 flex-1 items-center justify-center rounded-2xl border border-black"
          >
            <Text className="font-black">Negotiate</Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={add.isPending}
          onPress={() => void addToCart()}
          className="h-14 flex-[1.3] items-center justify-center rounded-2xl bg-hook"
        >
          {add.isPending ? (
            <HookLoader size="button" />
          ) : (
            <Text className="font-black">Add to basket</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
