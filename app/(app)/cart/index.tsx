import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheetModal } from "@/components/shared/BottomSheetModal";
import { HookLoader } from "@/components/shared/HookLoader";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { toast } from "@/components/shared/toast";
import {
  useCartQuery,
  useClearCartMutation,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from "@/lib/mobile-api";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const cart = useCartQuery();
  const update = useUpdateCartItemMutation();
  const remove = useRemoveCartItemMutation();
  const clear = useClearCartMutation();
  const [workingId, setWorkingId] = useState<string>();
  const [confirmClear, setConfirmClear] = useState(false);
  const data = cart.data as any;

  async function change(item: any, quantity: number) {
    if (quantity < 1 || workingId) return;
    setWorkingId(item.id);
    try {
      await update.mutateAsync({ itemId: item.id, quantity });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update quantity",
      );
    } finally {
      setWorkingId(undefined);
    }
  }
  async function removeItem(item: any) {
    if (workingId) return;
    setWorkingId(item.id);
    try {
      await remove.mutateAsync(item.id);
      toast.success("Item removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove item",
      );
    } finally {
      setWorkingId(undefined);
    }
  }
  async function clearCart() {
    try {
      await clear.mutateAsync();
      setConfirmClear(false);
      toast.success("Cart cleared");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not clear cart",
      );
    }
  }
  function continueShopping() {
    router.push("/(tabs)/location" as never);
  }
  function checkout(stateId: string, eligible: boolean) {
    if (!eligible)
      return toast.error("Review this State basket before checkout");
    router.push({ pathname: "/checkout", params: { stateId } } as never);
  }

  if (cart.isLoading)
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f4f5]">
        <HookLoader label="Loading your cart" />
      </View>
    );
  if (cart.isError) return <CartError retry={() => cart.refetch()} />;
  const items = data?.items || [];
  if (!items.length) return <EmptyCart />;

  return (
    <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="arrow-back" size={21} />
        </Pressable>
        <Text className="text-xl font-black">Your cart</Text>
        <Pressable
          onPress={() => setConfirmClear(true)}
          className="h-11 items-center justify-center px-2"
        >
          <Text className="text-sm font-bold text-red-500">Clear</Text>
        </Pressable>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={cart.isRefetching}
            onRefresh={cart.refetch}
            tintColor="#111"
          />
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 180,
        }}
      >
        <Pressable
          onPress={continueShopping}
          className="flex-row items-center gap-3 rounded-[22px] bg-[#171717] p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Ionicons name="bag-handle-outline" size={22} color="#FFC809" />
          </View>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-black text-white">
              Hook marketplace
            </Text>
            <Text numberOfLines={1} className="mt-1 text-xs text-white/60">
              Continue browsing the commercial catalog
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color="#fff" />
        </Pressable>
        <View className="mt-4 gap-5">
          {(data.stateGroups || []).map((group: any, index: number) => (
            <View
              key={group.stateId}
              className="overflow-hidden rounded-[24px] bg-white"
            >
              <View className="flex-row items-center justify-between border-b border-black/5 px-4 py-4">
                <View>
                  <Text className="text-xs font-semibold uppercase text-[#777]">
                    State basket {index + 1}
                  </Text>
                  <Text className="mt-1 text-base font-black">
                    {group.items.length} product
                    {group.items.length === 1 ? "" : "s"}
                  </Text>
                </View>
                <Text className="font-black">
                  ₦{Number(group.subtotalMinor / 100).toLocaleString()}
                </Text>
              </View>
              <View className="gap-3 p-3">
                {group.items.map((item: any) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    busy={workingId === item.id}
                    onChange={(quantity) => change(item, quantity)}
                    onRemove={() => removeItem(item)}
                  />
                ))}
              </View>
              <View className="px-4 pb-4">
                <Pressable
                  onPress={() =>
                    checkout(group.stateId, group.checkoutEligible)
                  }
                  className={`h-13 items-center justify-center rounded-2xl ${group.checkoutEligible ? "bg-hook" : "bg-[#e5e5e7]"}`}
                >
                  <Text className="font-black">Checkout this State</Text>
                </Pressable>
                {group.blockingReasons?.length ? (
                  <Text className="mt-2 text-xs text-red-500">
                    Some products need your attention before checkout.
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
        <View className="mt-5 rounded-[22px] bg-white p-5">
          <SummaryRow
            label="Basket subtotal"
            value={Number(data.subtotalMinor || 0) / 100}
            strong
          />
          <Text className="mt-2 text-xs leading-5 text-[#777]">
            Delivery is calculated separately for each State during checkout.
          </Text>
        </View>
      </ScrollView>
      <View
        className="absolute inset-x-0 bottom-0 border-t border-black/5 bg-white px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 10 }}
      >
        <Text className="text-center text-xs text-[#777]">
          Choose a State section above to checkout
        </Text>
      </View>
      <BottomSheetModal
        visible={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear your cart?"
      >
        <Text className="text-center text-sm leading-6 text-[#666]">
          This removes every item currently saved in your cart.
        </Text>
        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={() => setConfirmClear(false)}
            className="h-13 flex-1 items-center justify-center rounded-2xl bg-[#f1f1f3]"
          >
            <Text className="font-bold">Keep items</Text>
          </Pressable>
          <Pressable
            disabled={clear.isPending}
            onPress={() => void clearCart()}
            className="h-13 flex-1 items-center justify-center rounded-2xl bg-red-500"
          >
            {clear.isPending ? (
              <HookLoader size="button" variant="dark" />
            ) : (
              <Text className="font-bold text-white">Clear cart</Text>
            )}
          </Pressable>
        </View>
      </BottomSheetModal>
    </View>
  );
}

function CartRow({
  item,
  busy,
  onChange,
  onRemove,
}: {
  item: any;
  busy: boolean;
  onChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const product = item.product;
  return (
    <View
      className={`flex-row gap-3 rounded-[18px] bg-[#fafafa] p-3 ${item.checkoutEligible ? "" : "border border-red-100"}`}
    >
      <View className="h-24 w-24 overflow-hidden rounded-[16px] bg-[#f1f1f3]">
        <RemoteImage uri={product?.images?.[0]} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            numberOfLines={2}
            className="flex-1 text-sm font-black leading-5"
          >
            {product?.title || "Unavailable product"}
          </Text>
          <Pressable onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color="#aaa" />
          </Pressable>
        </View>
        {item.selectedVariants?.color || item.selectedVariants?.size ? (
          <Text numberOfLines={1} className="mt-1 text-xs text-[#777]">
            {[item.selectedVariants?.color, item.selectedVariants?.size]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        ) : null}
        <Text className="mt-2 text-sm font-black">
          ₦{(Number(item.totalPriceMinor || 0) / 100).toLocaleString()}
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          {!item.checkoutEligible ? (
            <Text className="text-xs font-bold text-red-500">
              Review required
            </Text>
          ) : (
            <View className="flex-row items-center rounded-full bg-[#f2f2f3] p-1">
              <Pressable
                disabled={busy || item.quantity <= 1}
                onPress={() => onChange(item.quantity - 1)}
                className="h-7 w-7 items-center justify-center rounded-full bg-white"
              >
                <Ionicons name="remove" size={15} />
              </Pressable>
              <View className="w-9 items-center">
                {busy ? (
                  <HookLoader size="button" />
                ) : (
                  <Text className="text-xs font-black">{item.quantity}</Text>
                )}
              </View>
              <Pressable
                disabled={busy || item.quantity >= 99}
                onPress={() => onChange(item.quantity + 1)}
                className="h-7 w-7 items-center justify-center rounded-full bg-white"
              >
                <Ionicons name="add" size={15} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className={strong ? "text-base font-black" : "text-sm text-[#666]"}>
        {label}
      </Text>
      <Text className={strong ? "text-xl font-black" : "text-sm font-bold"}>
        ₦{Number(value || 0).toLocaleString()}
      </Text>
    </View>
  );
}
function EmptyCart() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 items-center justify-center bg-[#f4f4f5] px-8"
      style={{ paddingTop: insets.top }}
    >
      <View className="h-20 w-20 items-center justify-center rounded-full bg-white">
        <Ionicons name="bag-outline" size={36} color="#aaa" />
      </View>
      <Text className="mt-5 text-xl font-black">Your cart is empty</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-[#777]">
        Products you add from Hook’s commercial catalog will appear here.
      </Text>
      <Pressable
        onPress={() => router.replace("/(tabs)/location")}
        className="mt-6 rounded-full bg-black px-5 py-3.5"
      >
        <Text className="font-black text-white">Discover products</Text>
      </Pressable>
    </View>
  );
}
function CartError({ retry }: { retry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-[#f4f4f5] px-8">
      <Ionicons name="cloud-offline-outline" size={44} color="#aaa" />
      <Text className="mt-4 text-xl font-black">Cart unavailable</Text>
      <Text className="mt-2 text-center text-sm text-[#777]">
        Check your connection and try again.
      </Text>
      <Pressable
        onPress={retry}
        className="mt-5 rounded-full bg-hook px-6 py-3"
      >
        <Text className="font-bold">Try again</Text>
      </Pressable>
    </View>
  );
}
