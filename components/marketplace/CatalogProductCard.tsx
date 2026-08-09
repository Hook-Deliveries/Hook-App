import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { toast } from "@/components/shared/toast";
import { ApiError } from "@/lib/api";
import {
  useCustomerSessionQuery,
  useLikedProductsQuery,
  useToggleProductLikeMutation,
  type PublicCatalogProduct,
} from "@/lib/mobile-api";

export function CatalogProductCard({
  product,
  compact,
  variant = "default",
}: {
  product: PublicCatalogProduct;
  compact?: boolean;
  variant?: "default" | "figma";
}) {
  const figma = variant === "figma";
  const session = useCustomerSessionQuery();
  const likes = useLikedProductsQuery();
  const toggleLike = useToggleProductLikeMutation();
  const isLiked = likes.data?.productIds.includes(product.publicId) ?? false;
  const likePending =
    toggleLike.isPending &&
    toggleLike.variables?.productId === product.publicId;

  async function handleLike(event: { stopPropagation?: () => void }) {
    event.stopPropagation?.();
    if (session.isPending) return;
    try {
      await toggleLike.mutateAsync({
        productId: product.publicId,
        liked: isLiked,
        product,
      });
      toast.success(isLiked ? "Removed from saved" : "Saved to your likes");
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status === 401
          ? "Sign in to save products"
          : "Could not update saved products",
      );
    }
  }

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/products/[id]",
          params: { id: product.publicId },
        } as never)
      }
      className="flex-1"
    >
      <View
        className={`relative aspect-square overflow-hidden bg-[#FAFAFA] ${
          figma ? "rounded-t-[10px] rounded-b-[20px]" : "rounded-xl"
        }`}
      >
        <RemoteImage uri={product.media?.[0]?.url} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isLiked
              ? `Remove ${product.title} from likes`
              : `Save ${product.title} to likes`
          }
          accessibilityState={{ selected: isLiked, disabled: likePending }}
          disabled={likePending}
          onPress={handleLike}
          className={`absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full ${
            figma ? "bg-[#F1F1F3]" : "bg-white/90"
          }`}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={16}
            color={isLiked ? "#FFC809" : "#777"}
          />
        </Pressable>
        {product.market?.name ? (
          <View className="absolute bottom-2 left-2 rounded-full bg-white/25 px-2 py-1">
            <Text numberOfLines={1} className="max-w-24 text-[8px] text-black">
              {product.market.name}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        className={`mt-2 font-semibold text-black ${compact ? "text-[11px]" : "text-[12px]"}`}
      >
        {product.title}
      </Text>
      <View className="mt-1 flex-row items-center gap-2">
        <Text className="text-[12px] font-black text-[#E7B200]">
          ₦{Math.round(product.effectivePriceMinor / 100).toLocaleString()}
        </Text>
        {product.discountMinor > 0 ? (
          <Text className="text-[9px] text-[#888] line-through">
            ₦{Math.round(product.sellingPriceMinor / 100).toLocaleString()}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
