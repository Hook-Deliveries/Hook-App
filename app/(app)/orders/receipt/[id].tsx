import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Reveal } from "@/components/motion/Reveal";
import { HookBackButton } from "@/components/shared/HookBackButton";
import { SkeletonListPage } from "@/components/motion/Skeleton";
import { toast } from "@/components/shared/toast";
import { centeredHeaderTextStyle, screenPadding } from "@/constants/design-tokens";
import { ParcelReceiptCard } from "@/components/orders/ParcelReceiptCard";
import { openFezTracking } from "@/lib/fez-tracking";
import { parcelReceiptHtml } from "@/lib/receipt-html";
import { useOrderQuery, useOrderReceiptQuery } from "@/lib/mobile-api";

const money = (minor?: number) => `₦${(Number(minor || 0) / 100).toLocaleString("en-NG")}`;
const date = (value?: string) => (value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—");

function Row({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-[#666]">{label}</Text>
      <Text className={`text-sm font-bold ${tone === "green" ? "text-emerald-600" : "text-[#111]"}`}>{value}</Text>
    </View>
  );
}

export default function OrderReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const orderQuery = useOrderQuery(id);
  const receiptQuery = useOrderReceiptQuery(id);
  const order = orderQuery.data as any;
  const receipt = receiptQuery.data;
  const loading = orderQuery.isLoading || receiptQuery.isLoading;

  const trackingNumber = receipt?.courier?.trackingNumber;

  const [sharing, setSharing] = React.useState(false);

  function receiptHtml() {
    return parcelReceiptHtml({
      receiptNumber: receipt!.receiptNumber,
      orderId: receipt!.order?.publicId || order?.displayNumber || "",
      receivedAt: receipt!.receivedAt || receipt!.packedAt,
      placedAt: order?.createdAt,
      recipient: { name: order?.address?.recipientName, phone: order?.address?.phone, address: order?.address?.formattedAddress },
      courier: receipt!.courier,
      paymentLabel: String(order?.paymentMethod || "PREPAID").toUpperCase() === "PREPAID" ? "Prepaid" : String(order?.paymentMethod || "").replaceAll("_", " "),
      items: receipt!.items,
    });
  }

  async function shareReceipt() {
    if (!receipt || sharing) return;
    setSharing(true);
    try {
      // PDF first; the modules are loaded lazily so an older installed build without them falls back to text.
      const Print = await import("expo-print");
      const Sharing = await import("expo-sharing");
      if (!(await Sharing.isAvailableAsync())) throw new Error("sharing unavailable");
      const file = await Print.printToFileAsync({ html: receiptHtml(), width: 420, height: 560 + receipt.items.length * 36 });
      await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: `Hook receipt ${receipt.receiptNumber}` });
      return;
    } catch {
      /* fall through to text share */
    } finally {
      setSharing(false);
    }
    await shareText();
  }

  async function shareText() {
    if (!receipt) return;
    const lines = [
      `Hook receipt ${receipt.receiptNumber}`,
      order?.displayNumber ? `Order ${order.displayNumber}` : "",
      `Received at hub: ${date(receipt.receivedAt || receipt.packedAt)}`,
      "",
      ...(order?.items?.length
        ? order.items.map((item: any) => `${item.quantity}× ${item.title} — ${money(item.lineTotalMinor)}`)
        : receipt.items.map((item) => `${item.quantity}× ${item.title}`)),
      "",
      order ? `Total: ${money(order.totalMinor)}` : "",
      receipt.courier?.name ? `Courier: ${receipt.courier.name}` : "",
      trackingNumber ? `Tracking ID: ${trackingNumber}` : "",
    ].filter((line, index, all) => line !== "" || (index > 0 && all[index - 1] !== ""));
    try {
      await Share.share({ message: lines.join("\n"), title: `Hook receipt ${receipt.receiptNumber}` });
    } catch {
      toast.error("Receipt could not be shared");
    }
  }

  return (
    <View className="flex-1 bg-[#f3f3f5]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between py-3" style={{ paddingHorizontal: screenPadding }}>
        <HookBackButton />
        <Text style={centeredHeaderTextStyle}>Receipt</Text>
        <Pressable onPress={() => void shareReceipt()} disabled={!receipt || sharing} className="h-11 w-11 items-center justify-center rounded-full bg-white disabled:opacity-40" accessibilityLabel="Share receipt">
          <Ionicons name="share-outline" size={20} color="#111" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 pt-4"><SkeletonListPage rows={3} /></View>
      ) : !receipt ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-white"><Ionicons name="receipt-outline" size={28} color="#777" /></View>
          <Text className="mt-5 text-center text-xl font-black">Receipt not ready yet</Text>
          <Text className="mt-2 text-center text-sm leading-6 text-[#777]">Your receipt is issued once your order reaches the Hook hub.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: screenPadding, paddingTop: 8, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
          <Reveal index={0}>
            <ParcelReceiptCard
              receiptNumber={receipt.receiptNumber}
              orderId={receipt.order?.publicId || ""}
              receivedAt={receipt.receivedAt || receipt.packedAt}
              placedAt={order?.createdAt}
              recipient={{ name: order?.address?.recipientName, phone: order?.address?.phone, address: order?.address?.formattedAddress }}
              courier={receipt.courier}
              paymentLabel={String(order?.paymentMethod || "PREPAID").toUpperCase() === "PREPAID" ? "Prepaid" : String(order?.paymentMethod || "").replaceAll("_", " ")}
              items={receipt.items}
            />
          </Reveal>
          {order ? (
            <Reveal index={1} className="mt-4">
              <View className="rounded-[22px] bg-white p-4">
                <Text className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#71717a]">Payment summary</Text>
                <View className="gap-3">
                  <Row label="Products" value={money(order.subtotalMinor)} />
                  {Number(order.vatMinor) > 0 ? <Row label="VAT" value={money(order.vatMinor)} /> : null}
                  <Row label="Delivery" value={money(order.deliveryFeeMinor)} />
                  {Number(order.couponDiscountMinor || 0) > 0 ? <Row label="Coupon" value={`−${money(order.couponDiscountMinor)}`} tone="green" /> : null}
                  {Number(order.creditsAppliedMinor || 0) > 0 ? <Row label="Hook credit" value={`−${money(order.creditsAppliedMinor)}`} tone="green" /> : null}
                  <View className="flex-row items-center justify-between border-t border-black/10 pt-4">
                    <Text className="text-base font-black">Total paid</Text>
                    <Text className="text-xl font-black">{money(order.totalMinor)}</Text>
                  </View>
                </View>
              </View>
            </Reveal>
          ) : null}
        </ScrollView>
      )}

      {receipt ? (
        <View className="absolute inset-x-0 bottom-0 bg-[#f3f3f5] px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
<View className="flex-row gap-2">
            {trackingNumber ? (
              <Pressable onPress={() => void openFezTracking(trackingNumber)} className="h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-black">
                <Ionicons name="navigate-outline" size={19} color="#FFC809" />
                <Text className="font-black text-white">Track order</Text>
              </Pressable>
            ) : null}
            <Pressable disabled={sharing} onPress={() => void shareReceipt()} className="h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-hook disabled:opacity-60">
              <Ionicons name="share-outline" size={19} color="#111" />
              <Text className="font-black">{sharing ? "Preparing PDF…" : "Share receipt"}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
