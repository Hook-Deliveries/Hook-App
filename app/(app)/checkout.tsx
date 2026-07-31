import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HookLoader } from "@/components/shared/HookLoader";
import { toast } from "@/components/shared/toast";
import { apiRequest } from "@/lib/api";
import { getSession } from "@/lib/session";
import {
  useAddressesQuery,
  useCartQuery,
  useCheckoutConfirmMutation,
  useCheckoutPreviewMutation,
  useCommerceConfigQuery,
  useInitializePaymentMutation,
} from "@/lib/mobile-api";

type PaymentMethod = "PREPAID" | "PAY_AT_HANDOVER";

export default function CheckoutScreen() {
  const { stateId } = useLocalSearchParams<{ stateId: string }>();
  const insets = useSafeAreaInsets();
  const cart = useCartQuery();
  const addresses = useAddressesQuery();
  const config = useCommerceConfigQuery();
  const preview = useCheckoutPreviewMutation();
  const confirm = useCheckoutConfirmMutation();
  const initialize = useInitializePaymentMutation();
  const [addressId, setAddressId] = useState<string>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PREPAID");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const selectedAddress =
    addressId ||
    addresses.data?.find((item) => item.isDefault)?.publicId ||
    addresses.data?.[0]?.publicId;
  const group = useMemo(
    () =>
      (cart.data as any)?.stateGroups?.find(
        (item: any) => item.stateId === stateId,
      ),
    [cart.data, stateId],
  );
  const busy = preview.isPending || confirm.isPending || initialize.isPending;

  useEffect(() => {
    void getSession().then((session) => {
      if (!session?.user || session.user.accountType !== "customer") {
        toast.info(
          "Sign in or create an account to keep your basket and checkout",
        );
        router.replace("/auth" as never);
      } else if (!session.user.isEmailVerified) {
        toast.info("Verify your email before checkout");
        router.replace("/auth" as never);
      }
    });
  }, []);

  async function placeOrder() {
    if (!stateId || !group)
      return toast.error("This State basket is no longer available");
    if (!selectedAddress)
      return toast.error("Add a covered delivery address first");
    const policyVersions = config.data?.policyVersions;
    if (
      !policyVersions?.TERMS ||
      !policyVersions?.PRIVACY ||
      !policyVersions?.RETURNS
    )
      return toast.error("Checkout policies are temporarily unavailable");
    if (!acceptedPolicies)
      return toast.error("Accept the current Hook policies to continue");
    try {
      const summary = await preview.mutateAsync({
        stateId,
        addressId: selectedAddress,
        deliveryMethod: "HOME_DELIVERY",
        paymentMethod,
        policyVersions,
      });
      const order = await confirm.mutateAsync({
        stateId,
        previewToken: summary.previewToken,
        idempotencyKey: Crypto.randomUUID(),
      });
      if (paymentMethod === "PAY_AT_HANDOVER") {
        toast.success(
          order.commerceStatus === "VERIFICATION_PENDING"
            ? "Order sent for high-value review"
            : "Order sent for confirmation",
        );
        router.replace({
          pathname: "/orders/[id]",
          params: { id: order.id },
        } as never);
        return;
      }
      const payment = await initialize.mutateAsync({ orderId: order.id });
      if (!payment.authorizationUrl)
        throw new Error("Secure payment checkout is unavailable");
      await WebBrowser.openAuthSessionAsync(
        payment.authorizationUrl,
        "hook://payments/return",
      );
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const status = await apiRequest<any>(`/payments/${order.id}`);
        if (status.payment?.status === "CONFIRMED") {
          toast.success("Payment confirmed");
          router.replace({
            pathname: "/orders/[id]",
            params: { id: order.id },
          } as never);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      toast.info("Payment confirmation is still processing");
      router.replace({
        pathname: "/payments/[id]",
        params: { id: order.id },
      } as never);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Checkout could not be completed",
      );
    }
  }

  if (cart.isLoading || addresses.isLoading || config.isLoading)
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f4f5]">
        <HookLoader label="Preparing checkout" />
      </View>
    );
  if (!group)
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f4f5] px-8">
        <Text className="text-xl font-black">State basket unavailable</Text>
        <Pressable
          onPress={() => router.replace("/cart")}
          className="mt-5 rounded-full bg-hook px-6 py-3"
        >
          <Text className="font-bold">Back to basket</Text>
        </Pressable>
      </View>
    );

  return (
    <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="arrow-back" size={21} />
          </Pressable>
          <View>
            <Text className="text-2xl font-black">Checkout</Text>
            <Text className="text-xs text-[#666]">
              One State · {group.items.length} product
              {group.items.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
        <Section
          title="Delivery address"
          action="Manage"
          onAction={() => router.push("/addresses" as never)}
        >
          {addresses.data?.length ? (
            <View className="gap-2">
              {addresses.data.map((address) => (
                <Pressable
                  key={address.publicId}
                  onPress={() => setAddressId(address.publicId)}
                  className={`rounded-2xl border p-4 ${selectedAddress === address.publicId ? "border-hook bg-[#fff9df]" : "border-black/5 bg-[#fafafa]"}`}
                >
                  <Text className="font-black">{address.label}</Text>
                  <Text className="mt-1 text-sm text-[#666]">
                    {address.line1}
                  </Text>
                  <Text className="mt-1 text-xs text-[#888]">
                    {address.recipientName} · {address.phone}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/addresses" as never)}
              className="h-13 items-center justify-center rounded-2xl bg-hook"
            >
              <Text className="font-bold">Add delivery address</Text>
            </Pressable>
          )}
        </Section>
        <Section title="Payment">
          <View className="gap-2">
            <PaymentChoice
              active={paymentMethod === "PREPAID"}
              title="Pay now"
              description="Complete payment securely with Paystack."
              onPress={() => setPaymentMethod("PREPAID")}
            />
            <PaymentChoice
              active={paymentMethod === "PAY_AT_HANDOVER"}
              title="Pay at handover"
              description="Subject to coverage, account and Operations approval."
              disabled={!config.data?.podEnabled}
              onPress={() => setPaymentMethod("PAY_AT_HANDOVER")}
            />
          </View>
        </Section>
        <Section title="Order summary">
          <Row label="Products" value={group.subtotalMinor} />
          <Text className="mt-3 text-xs leading-5 text-[#777]">
            Your exact delivery fee and total are locked in the secure preview
            before the Order is created.
          </Text>
        </Section>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedPolicies }}
          onPress={() => setAcceptedPolicies((value) => !value)}
          className="mt-4 flex-row items-start gap-3 rounded-2xl bg-white p-4"
        >
          <View
            className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${acceptedPolicies ? "border-black bg-black" : "border-[#aaa]"}`}
          >
            {acceptedPolicies ? (
              <Ionicons name="checkmark" size={14} color="#FFC809" />
            ) : null}
          </View>
          <Text className="flex-1 text-xs leading-5 text-[#666]">
            I accept the current Hook Terms, Privacy Policy, and Returns Policy
            for this Order.
          </Text>
        </Pressable>
      </ScrollView>
      <View
        className="absolute inset-x-0 bottom-0 border-t border-black/5 bg-white px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <Pressable
          disabled={busy || !selectedAddress || !acceptedPolicies}
          onPress={() => void placeOrder()}
          className={`h-14 items-center justify-center rounded-2xl ${busy || !selectedAddress || !acceptedPolicies ? "bg-[#e3e3e5]" : "bg-hook"}`}
        >
          {busy ? (
            <HookLoader size="button" />
          ) : (
            <Text className="font-black">Review and place Order</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4 rounded-[22px] bg-white p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-black">{title}</Text>
        {action ? (
          <Pressable onPress={onAction}>
            <Text className="text-sm font-bold text-[#9a7300]">{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
function PaymentChoice({
  active,
  title,
  description,
  disabled,
  onPress,
}: {
  active: boolean;
  title: string;
  description: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border p-4 ${active ? "border-hook bg-[#fff9df]" : "border-black/5 bg-[#fafafa]"} ${disabled ? "opacity-40" : ""}`}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border ${active ? "border-black bg-black" : "border-[#aaa]"}`}
      >
        {active ? <View className="h-2 w-2 rounded-full bg-hook" /> : null}
      </View>
      <View className="flex-1">
        <Text className="font-black">{title}</Text>
        <Text className="mt-1 text-xs leading-4 text-[#777]">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
function Row({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-[#666]">{label}</Text>
      <Text className="font-black">
        ₦{(Number(value || 0) / 100).toLocaleString()}
      </Text>
    </View>
  );
}
