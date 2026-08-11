import React from "react";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HookPageLoading } from "@/components/shared/HookPageLoading";
import { HookBackButton } from "@/components/shared/HookBackButton";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { toast } from "@/components/shared/toast";
import { useCreateReturnMutation, useInitializePaymentMutation, useOrderFulfilmentQuery, useOrderQuery, usePaymentStatusQuery } from "@/lib/mobile-api";

const label = (value?: string) => String(value || "-").replaceAll("_", " ");
const money = (minor?: number) => `₦${(Number(minor || 0) / 100).toLocaleString()}`;

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const query = useOrderQuery(id);
  const fulfilment = useOrderFulfilmentQuery(id);
  const payment = usePaymentStatusQuery(id);
  const initializePayment = useInitializePaymentMutation();
  const createReturn = useCreateReturnMutation();
  const [returnReason, setReturnReason] = React.useState("");
  const [paymentBusy, setPaymentBusy] = React.useState(false);
  const order = query.data as any;
  if (query.isLoading)
    return <HookPageLoading title="Order details" label="Loading order" />;
  if (!order)
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="font-black">Order unavailable</Text>
      </View>
    );

  const paymentRecord = (payment.data as any)?.payment;
  const paymentStatus = String(paymentRecord?.status || order.commercePaymentStatus || "").toUpperCase();
  const shipment = fulfilment.data?.shipment as any;
  const handoverPaymentDue = order.commercePaymentMethod === "PAY_AT_HANDOVER" && shipment?.status === "AWAITING_HANDOVER_PAYMENT";
  const canPay = !["CONFIRMED", "REFUNDED", "CANCELLED"].includes(paymentStatus)
    && (order.commercePaymentMethod === "PREPAID" || handoverPaymentDue);

  async function resumePayment(fulfilmentGroupId?: string) {
    if (!id || paymentBusy) return;
    setPaymentBusy(true);
    try {
      const initialized = await initializePayment.mutateAsync({ orderId: id, fulfilmentGroupId });
      if (!initialized?.authorizationUrl) throw new Error("Secure payment checkout is unavailable");
      const result = await WebBrowser.openAuthSessionAsync(initialized.authorizationUrl, "hook://payments/return");
      await WebBrowser.dismissBrowser();
      if (result.type === "cancel" || result.type === "dismiss") return;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const refreshed = await payment.refetch();
        if (String((refreshed.data as any)?.payment?.status || "").toUpperCase() === "CONFIRMED") {
          toast.success("Payment confirmed");
          await Promise.all([query.refetch(), fulfilment.refetch()]);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      toast.info("Payment confirmation is still processing");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment could not be started");
    } finally {
      setPaymentBusy(false);
    }
  }

  return (
    <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <HookBackButton />
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
          {(order.fulfilmentGroups?.length ? order.fulfilmentGroups : [{ publicId: "legacy", sourceStateId: order.sourceStateId, status: order.commerceStatus }]).map((group: any, groupIndex: number) => {
            const groupItems = (order.items || []).filter((item: any) => !item.fulfilmentGroupId || item.fulfilmentGroupId === group.publicId);
            const groupPayment = (order.payments || []).find((entry: any) => entry.fulfilmentGroupId === group.publicId);
            return <View key={group.publicId || groupIndex} className="rounded-[22px] bg-white p-3">
              <View className="mb-3 flex-row items-center justify-between gap-3 px-1">
                <View><Text className="font-black">Delivery {groupIndex + 1}</Text><Text className="text-xs text-[#777]">{label(group.status)} · {group.sourceStateId || "Source state"}</Text></View>
                {order.commercePaymentMethod === "PAY_AT_HANDOVER" && groupPayment && String(groupPayment.commerceStatus || groupPayment.status).toUpperCase() !== "CONFIRMED" ? <Pressable onPress={() => void resumePayment(group.publicId)} disabled={paymentBusy} className="rounded-full bg-hook px-4 py-2"><Text className="text-xs font-black">Pay for delivery</Text></Pressable> : null}
              </View>
              <View className="gap-3">
          {groupItems.map((item: any) => (
            <View
              key={item.id || item.publicId}
              className="flex-row gap-3 rounded-[18px] bg-[#f7f7f8] p-3"
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
                  {money(item.totalPriceMinor)}
                </Text>
                <Text className="mt-1 text-[11px] font-bold uppercase text-[#777]">{label(item.deliveryStatus || "processing")}</Text>
              </View>
            </View>
          ))}
              </View>
            </View>;
          })}
        </View>
        <View className="mt-4 rounded-[20px] bg-white p-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-black">Payment</Text>
              <Text className="mt-1 text-xs text-[#777]">{label(order.commercePaymentMethod)} · {label(paymentStatus || "pending")}</Text>
            </View>
            {canPay ? <Pressable onPress={() => void resumePayment()} disabled={paymentBusy} className="rounded-full bg-hook px-4 py-2"><Text className="text-xs font-black">{paymentBusy ? "Opening..." : "Pay securely"}</Text></Pressable> : null}
          </View>
          {order.commercePaymentMethod === "PAY_AT_HANDOVER" && paymentStatus !== "CONFIRMED" ? <Text className="mt-3 text-xs leading-5 text-[#777]">Payment is required before a Pay-at-Handover parcel can be released.</Text> : null}
        </View>
        {fulfilment.data ? (
          <View className="mt-4 rounded-[20px] bg-white p-4">
            <Text className="text-base font-black">Delivery progress</Text>
            <Text className="mt-1 text-xs text-[#777]">Live updates from Runner, Hub, shipment, and collection operations.</Text>
            <View className="mt-4 gap-3">
              {(fulfilment.data.tasks || []).map((task: any, index: number) => (
                <View key={task.publicId || task.id || index} className="flex-row items-center gap-3">
                  <View className="h-2.5 w-2.5 rounded-full bg-hook" />
                  <View className="flex-1"><Text className="text-sm font-bold">{String(task.status || "pending").replaceAll("_", " ")}</Text><Text className="text-xs text-[#777]">Market {task.marketId || "-"}</Text></View>
                </View>
              ))}
              {shipment ? <View className="flex-row items-start gap-3"><View className="mt-1 h-2.5 w-2.5 rounded-full bg-hook" /><View className="flex-1"><Text className="text-sm font-bold">{label(shipment.status)}</Text><Text className="text-xs text-[#777]">{shipment.provider || "Approved logistics provider"}{shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ""}</Text>{shipment.trackingEvents?.slice(-3).map((event: any, index: number) => <Text key={`${event.status || "event"}-${index}`} className="mt-1 text-[11px] text-[#999]">{label(event.status)} · {event.at ? new Date(event.at).toLocaleString() : ""}</Text>)}</View></View> : null}
              {fulfilment.data.custody ? <View className="flex-row items-start gap-3"><View className="mt-1 h-2.5 w-2.5 rounded-full bg-hook" /><View><Text className="text-sm font-bold">Partner collection</Text><Text className="text-xs text-[#777]">Collection is available at the initiating Partner.</Text>{fulfilment.data.custody.collectionCodeHint ? <Text className="mt-1 text-xs font-bold text-[#777]">Code ending {fulfilment.data.custody.collectionCodeHint}</Text> : null}</View></View> : null}
            </View>
          </View>
        ) : null}
        {fulfilment.data?.returns?.length || fulfilment.data?.refunds?.length ? <View className="mt-4 rounded-[20px] bg-white p-4"><Text className="text-base font-black">Returns and refunds</Text><View className="mt-3 gap-2">{fulfilment.data.returns?.map((item: any, index: number) => <View key={item.publicId || item.id || `return-${index}`} className="flex-row items-center justify-between gap-3"><Text className="text-sm">Return request</Text><Text className="text-xs font-bold text-[#777]">{label(item.status)}</Text></View>)}{fulfilment.data.refunds?.map((item: any, index: number) => <View key={item.publicId || item.id || `refund-${index}`} className="flex-row items-center justify-between gap-3"><Text className="text-sm">Refund {money(item.amountMinor)}</Text><Text className="text-xs font-bold text-[#777]">{label(item.status)}</Text></View>)}</View></View> : null}
        {String(order.commerceStatus || order.status) === "DELIVERED" || String(order.commerceStatus || order.status) === "COLLECTED" ? (
          <View className="mt-4 rounded-[20px] bg-white p-4">
            <Text className="text-base font-black">Report an issue</Text>
            <Text className="mt-1 text-xs text-[#777]">Issues must be reported within 24 hours of delivery or collection.</Text>
            <TextInput value={returnReason} onChangeText={setReturnReason} placeholder="Describe the issue" multiline className="mt-3 min-h-20 rounded-2xl border border-[#e5e5e5] px-3 py-3 text-sm" />
            <Pressable disabled={!returnReason.trim() || createReturn.isPending} onPress={() => createReturn.mutate({ orderId: id || "", orderItemIds: (order.items || []).map((item: any) => item.id || item._id), reasonType: "OTHER", reason: returnReason.trim() })} className="mt-3 items-center rounded-full bg-black px-4 py-3"><Text className="font-bold text-white">{createReturn.isPending ? "Sending..." : "Submit issue"}</Text></Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
