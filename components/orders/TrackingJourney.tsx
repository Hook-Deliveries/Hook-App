import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { Pressable, Share, Text, View } from "react-native";

import { toast } from "@/components/shared/toast";
import { openFezTracking } from "@/lib/fez-tracking";

type Receipt = { receivedAt?: string; packedAt?: string; courier?: { name?: string; trackingNumber?: string } } | undefined;

// Where each backend status sits on the customer-facing journey.
const RANK: Record<string, number> = {
  AWAITING_PAYMENT: 0, PENDING: 0,
  VERIFICATION_PENDING: 1, OPERATIONS_REVIEW: 1, APPROVED_FOR_FULFILMENT: 1,
  IN_FULFILMENT: 2,
  PARTIALLY_RECEIVED: 3, READY_FOR_CONSOLIDATION: 3,
  READY_FOR_DISPATCH: 4, READY_FOR_BOOKING: 4,
  BOOKED_WITH_PROVIDER: 5, AWAITING_PICKUP: 5,
  PICKED_UP: 6, IN_TRANSIT: 6, PARTIALLY_IN_TRANSIT: 6, OUT_FOR_DELIVERY: 6,
  DELIVERED: 8, COLLECTED: 8, COMPLETED: 8, PARTIALLY_DELIVERED: 7,
};

const fmt = (value?: string) => (value ? new Date(value).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : undefined);

/**
 * One end-to-end view of a delivery: courier + tracking ID up top, then every
 * stage from order placed to delivered, so the customer sees what's done and
 * what comes next (including the courier pickup).
 */
export function TrackingJourney({ order, delivery, receipt }: { order: any; delivery: any; receipt?: Receipt }) {
  const shipment = delivery?.shipment;
  const courier = shipment?.courierName || receipt?.courier?.name || order?.logisticsProvider?.name || "Courier";
  const tracking: string | undefined = shipment?.trackingReference || receipt?.courier?.trackingNumber;
  const status = String(delivery?.status || order?.status || "").toUpperCase();
  const orderStatus = String(order?.status || "").toUpperCase();
  let rank = Math.max(RANK[status] ?? 0, RANK[orderStatus] ?? 0);
  if (/PAID|CONFIRMED/.test(String(order?.paymentStatus || "").toUpperCase())) rank = Math.max(rank, 1);
  if (receipt?.receivedAt) rank = Math.max(rank, 4);
  if (receipt?.packedAt) rank = Math.max(rank, 4);
  if (tracking) rank = Math.max(rank, 5);
  const outForDelivery = status === "OUT_FOR_DELIVERY";

  const steps: { title: string; sub: string; at?: string; min: number }[] = [
    { title: "Order placed", sub: "We've received your order", at: order?.createdAt, min: 0 },
    { title: "Payment confirmed", sub: "Your payment was verified", min: 1 },
    { title: "Hook is sourcing your items", sub: "Collected from the market by our team", min: 2 },
    { title: "Reached Hook hub", sub: "Checked and verified on arrival", at: receipt?.receivedAt, min: 4 },
    { title: "Packed & booked", sub: `${courier} has been booked for pickup`, at: receipt?.packedAt || shipment?.bookedAt, min: 5 },
    { title: `${courier} pickup`, sub: "Courier collects your parcel from the hub", at: shipment?.pickedUpAt || shipment?.dispatchedAt, min: 6 },
    { title: outForDelivery ? "Out for delivery" : "On its way to you", sub: delivery?.eta ? `Expected ${fmt(delivery.eta)}` : "Heading to your address", min: 7 },
    { title: "Delivered", sub: "Enjoy your purchase", at: shipment?.deliveredAt, min: 8 },
  ];
  // Steps are "done" once the journey has moved past them; the first not-done step is the current one.
  const currentIndex = Math.max(steps.findIndex((step) => step.min > rank), 0);
  const allDone = rank >= 8;

  return (
    <View>
      {tracking ? (
        <View className="overflow-hidden rounded-2xl bg-black p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2"><Ionicons name="navigate-circle-outline" size={16} color="#FFC807" /><Text className="text-[11px] font-bold uppercase tracking-widest text-white/60">Tracking ID</Text></View>
            <View className="rounded-full bg-white/15 px-2.5 py-1"><Text className="text-[11px] font-bold text-white">{courier}</Text></View>
          </View>
          <Text selectable className="mt-2 text-[22px] font-black tracking-wider text-white">{tracking}</Text>
          <View className="mt-3 flex-row gap-2">
            <Pressable onPress={async () => { await Clipboard.setStringAsync(tracking); toast.success("Tracking ID copied"); }} className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-hook"><Ionicons name="copy-outline" size={16} color="#111" /><Text className="text-[13px] font-black">Copy</Text></Pressable>
            <Pressable onPress={() => void Share.share({ message: `Track my Hook ${order?.displayNumber || "order"} with ${courier}\nTracking ID: ${tracking}` })} className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-white/15"><Ionicons name="share-outline" size={16} color="#fff" /><Text className="text-[13px] font-black text-white">Share</Text></Pressable>
          </View>
          <Pressable onPress={() => void openFezTracking(tracking)} className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-white"><Ionicons name="navigate-outline" size={17} color="#111" /><Text className="text-[13px] font-black">Track order on {courier}</Text><Ionicons name="open-outline" size={14} color="#111" /></Pressable>
        </View>
      ) : (
        <View className="flex-row items-center gap-2 rounded-2xl bg-[#f4f4f5] p-3"><Ionicons name="time-outline" size={16} color="#777" /><Text className="flex-1 text-xs font-semibold text-[#666]">Your {courier} tracking ID appears here once your parcel is packed and booked.</Text></View>
      )}

      <View className="mt-5">
        {steps.map((step, index) => {
          const done = allDone || index < currentIndex;
          const current = !allDone && index === currentIndex;
          const last = index === steps.length - 1;
          const when = fmt(step.at);
          return (
            <View key={step.title} className="flex-row gap-3">
              <View className="items-center">
                <View className={`h-6 w-6 items-center justify-center rounded-full ${done ? "bg-hook" : current ? "bg-black" : "bg-[#ececee]"}`}>
                  {done ? <Ionicons name="checkmark" size={14} color="#111" /> : current ? <View className="h-2 w-2 rounded-full bg-hook" /> : <View className="h-2 w-2 rounded-full bg-[#c9c9ce]" />}
                </View>
                {!last ? <View className={`min-h-6 w-0.5 flex-1 ${done ? "bg-hook" : "bg-[#ececee]"}`} /> : null}
              </View>
              <View className="flex-1 pb-4">
                <Text className={`text-sm ${current ? "font-black text-black" : done ? "font-bold text-[#222]" : "font-semibold text-[#aaa]"}`}>{step.title}</Text>
                {done || current ? <Text className="mt-0.5 text-xs leading-4 text-[#777]">{current && !when ? "In progress" : step.sub}</Text> : null}
                {when ? <Text className="mt-0.5 text-[11px] text-[#999]">{when}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
