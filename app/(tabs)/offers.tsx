import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Reveal } from "@/components/motion/Reveal";
import { SkeletonRows } from "@/components/motion/Skeleton";
import { negotiationMoney } from "@/components/negotiation/NegotiationComponents";
import { HookBackButton } from "@/components/shared/HookBackButton";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { getHookTabBarContentInset } from "@/components/tab-bar/layout";
import { useLockedPricesQuery, useNegotiationsQuery, useProductQuery } from "@/lib/mobile-api";
import type { LockedPrice } from "@/lib/negotiation-types";
import { isNegotiationActive } from "@/lib/negotiations";

type OfferRow = {
  negotiationId: string;
  status: string;
  sessionMode?: "fixed" | "unlimited";
  expiresAt?: string;
  remainingOffers?: number;
  maximumOffers?: number;
  offerCount?: number;
  variantId?: string;
  quantity?: number;
  lastDecision?: "ACCEPT" | "COUNTER" | "DECLINE";
  lastCounterPriceMinor?: number;
  agreedPriceMinor?: number;
  endReason?: string;
  createdAt?: string;
  updatedAt?: string;
  product?: { id?: string; title?: string; imageUrl?: string; effectivePriceMinor?: number };
};

type Segment = "active" | "locked" | "past";

/** "24:10", or "1:05:00" for a longer lock. */
function timeLeft(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

const secondsUntil = (iso: string | undefined, now: number) =>
  iso ? Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000)) : undefined;

const itemsText = (quantity = 1) => (quantity > 1 ? `${quantity} items` : "1 item");

function openOffer(row: OfferRow) {
  router.push(
    `/negotiations/new?resume=${encodeURIComponent(row.negotiationId)}&productId=${encodeURIComponent(row.product?.id || "")}&variantId=${encodeURIComponent(row.variantId || "")}&quantity=${row.quantity || 1}` as never,
  );
}

function openProduct(productId: string) {
  router.push({ pathname: "/products/[id]", params: { id: productId } } as never);
}

function Thumb({ uri, size = 64 }: { uri?: string; size?: number }) {
  return (
    <View className="overflow-hidden rounded-2xl bg-[#F1F1F3]" style={{ width: size, height: size }}>
      <RemoteImage uri={uri} />
    </View>
  );
}

/** A price the customer locked: the thing they can actually shop at right now. */
function LockedPriceCard({ price, now }: { price: LockedPrice; now: number }) {
  const product = useProductQuery(price.productId).data;
  const seconds = secondsUntil(price.expiresAt, now);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product?.title || "Product"}, locked price ${negotiationMoney(price.unitPriceMinor)} each`}
      onPress={() => openProduct(price.productId)}
      className="mx-4 mb-3 rounded-[22px] bg-white p-4 active:opacity-90"
    >
      <View className="flex-row items-center gap-3">
        <Thumb uri={product?.media?.find((item) => item.type === "image" && item.url)?.url} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="lock-closed" size={12} color="#287B35" />
            <Text className="text-[11px] font-bold text-[#287B35]">Price locked</Text>
          </View>
          <Text numberOfLines={1} className="mt-0.5 text-[15px] font-black text-[#0A0A0A]">
            {product?.title || "Your product"}
          </Text>
          <View className="mt-1 flex-row items-baseline gap-2">
            <Text className="text-[20px] font-black text-[#1B5E27]">{negotiationMoney(price.unitPriceMinor)}</Text>
            <Text className="text-[12px] text-[#888]">each</Text>
            <Text className="text-[12px] text-[#999] line-through">{negotiationMoney(price.listUnitMinor)}</Text>
          </View>
        </View>
        <View className="rounded-full bg-[#E5F4E7] px-2.5 py-1">
          <Text className="text-[11px] font-black text-[#287B35]">{price.percentOff}% off</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-[#F7F7F8] px-3.5 py-3">
        <View>
          <Text className="text-[11px] text-[#777]">Any quantity, any option</Text>
          <Text className="mt-0.5 text-[14px] font-black">
            {seconds === undefined ? "" : seconds > 0 ? `${timeLeft(seconds)} left` : "Expired"}
          </Text>
        </View>
        <View className="h-10 flex-row items-center gap-1.5 rounded-full bg-hook px-4">
          <Text className="text-[13px] font-bold">Shop at this price</Text>
          <Ionicons name="arrow-forward" size={14} color="#111" />
        </View>
      </View>
    </Pressable>
  );
}

/** A negotiation still in progress: where it stands and how long it has. */
function ActiveOfferCard({ row, now }: { row: OfferRow; now: number }) {
  const quantity = row.quantity || 1;
  const seconds = row.sessionMode === "unlimited" ? undefined : secondsUntil(row.expiresAt, now);
  const counterTotal = row.lastCounterPriceMinor ? row.lastCounterPriceMinor * quantity : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.product?.title || "Product"}, continue offer`}
      onPress={() => openOffer(row)}
      className="mx-4 mb-3 rounded-[22px] bg-white p-4 active:opacity-90"
    >
      <View className="flex-row items-center gap-3">
        <Thumb uri={row.product?.imageUrl} />
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[15px] font-black text-[#0A0A0A]">
            {row.product?.title || "Product offer"}
          </Text>
          <Text className="mt-0.5 text-[12px] text-[#777]">
            {itemsText(quantity)}
            {row.product?.effectivePriceMinor ? ` · list ${negotiationMoney(row.product.effectivePriceMinor * quantity)}` : ""}
          </Text>
        </View>
        {seconds !== undefined ? (
          <View className="rounded-full bg-[#FFF6CE] px-2.5 py-1">
            <Text className="text-[11px] font-black text-[#8A6500]">{seconds > 0 ? timeLeft(seconds) : "Ending"}</Text>
          </View>
        ) : null}
      </View>

      <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-[#F7F7F8] px-3.5 py-3">
        <View>
          <Text className="text-[11px] text-[#777]">{counterTotal ? "Hook's price" : "Your next step"}</Text>
          <Text className="mt-0.5 text-[14px] font-black">{counterTotal ? negotiationMoney(counterTotal) : "Pick a price to offer"}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[11px] text-[#777]">
            {row.remainingOffers ?? 0} {(row.remainingOffers ?? 0) === 1 ? "offer" : "offers"} left
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Text className="text-[13px] font-bold">Continue</Text>
            <Ionicons name="chevron-forward" size={14} color="#111" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

type Tone = "good" | "neutral" | "warn";

const TONES: Record<Tone, { box: string; icon: string; title: string; body: string }> = {
  good: { box: "bg-[#EEF7EF]", icon: "#287B35", title: "text-[#1B5E27]", body: "text-[#4C7F55]" },
  neutral: { box: "bg-[#F4F4F6]", icon: "#77777E", title: "text-[#3A3A40]", body: "text-[#77777E]" },
  warn: { box: "bg-[#FFF4E5]", icon: "#B26A00", title: "text-[#7A4A00]", body: "text-[#9A6A1F]" },
};

/** What happened, in plain words: a headline and one line of detail, never cut off. */
function pastOutcome(row: OfferRow): { tone: Tone; icon: keyof typeof Ionicons.glyphMap; title: string; detail: string } {
  const offers = row.offerCount || 0;
  if (row.status === "agreed")
    return {
      tone: "good",
      icon: "lock-closed",
      title: row.agreedPriceMinor ? `Locked at ${negotiationMoney(row.agreedPriceMinor)} each` : "Price locked",
      detail: "This price has ended. You can negotiate again.",
    };
  if (row.endReason === "PRODUCT_UNAVAILABLE")
    return { tone: "warn", icon: "alert-circle", title: "Product no longer available", detail: "It was taken off sale, so this offer ended." };
  if (row.status === "expired")
    return {
      tone: "neutral",
      icon: "time",
      title: "Timed out",
      detail: offers ? `You made ${offers} ${offers === 1 ? "offer" : "offers"}, but no price was agreed in time.` : "No offer was made in time.",
    };
  if (row.lastDecision === "DECLINE")
    return { tone: "neutral", icon: "close-circle", title: "No price agreed", detail: "Hook could not meet your last offer." };
  return { tone: "neutral", icon: "remove-circle", title: "Closed", detail: "This offer was closed without a price." };
}

/** "5 min ago", "3 h ago", then the date. */
function agoLabel(iso: string | undefined, now: number) {
  if (!iso) return "";
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

/** Today, Yesterday, a weekday inside the last week, then the date. */
function dayLabel(iso: string | undefined, now: number) {
  if (!iso) return "Earlier";
  const day = (value: number) => new Date(new Date(value).toDateString()).getTime();
  const diff = Math.round((day(now) - day(new Date(iso).getTime())) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return new Date(iso).toLocaleDateString("en-NG", { weekday: "long" });
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long" });
}

function PastOfferCard({ row, now }: { row: OfferRow; now: number }) {
  const outcome = pastOutcome(row);
  const tone = TONES[outcome.tone];
  const quantity = row.quantity || 1;
  const productId = row.product?.id;
  const canNegotiateAgain = Boolean(productId) && row.endReason !== "PRODUCT_UNAVAILABLE";
  return (
    <View className="mx-4 mb-3 rounded-[20px] bg-white p-3.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${row.product?.title || "Product"}, ${outcome.title}`}
        onPress={() => openOffer(row)}
        className="active:opacity-80"
      >
        <View className="flex-row items-center gap-3">
          <Thumb uri={row.product?.imageUrl} size={56} />
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-[15px] font-black text-[#0A0A0A]">
              {row.product?.title || "Product offer"}
            </Text>
            <Text className="mt-0.5 text-[12px] text-[#777]">
              {itemsText(quantity)}
              {row.product?.effectivePriceMinor ? ` · list ${negotiationMoney(row.product.effectivePriceMinor * quantity)}` : ""}
            </Text>
          </View>
          <Text className="self-start text-[11px] text-[#A0A0A6]">{agoLabel(row.updatedAt || row.createdAt, now)}</Text>
        </View>

        <View className={`mt-3 flex-row items-start gap-2.5 rounded-2xl px-3.5 py-3 ${tone.box}`}>
          <Ionicons name={outcome.icon} size={18} color={tone.icon} style={{ marginTop: 1 }} />
          <View className="min-w-0 flex-1">
            <Text className={`text-[13px] font-black ${tone.title}`}>{outcome.title}</Text>
            <Text className={`mt-0.5 text-[12px] leading-[17px] ${tone.body}`}>{outcome.detail}</Text>
          </View>
        </View>
      </Pressable>

      {canNegotiateAgain ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Negotiate ${row.product?.title || "this product"} again`}
          onPress={() => openProduct(productId!)}
          className="mt-3 h-10 flex-row items-center justify-center gap-1.5 rounded-full border border-black/15 active:opacity-70"
        >
          <Ionicons name="refresh" size={14} color="#111" />
          <Text className="text-[13px] font-bold">Negotiate again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SegmentControl({
  value,
  onChange,
  counts,
}: {
  value: Segment;
  onChange: (value: Segment) => void;
  counts: Record<Segment, number>;
}) {
  const items: Array<{ key: Segment; label: string }> = [
    { key: "active", label: "Active" },
    { key: "locked", label: "Locked" },
    { key: "past", label: "Past" },
  ];
  return (
    <View accessibilityRole="tablist" className="mx-4 flex-row rounded-full bg-white p-1">
      {items.map((item) => {
        const selected = value === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.key)}
            className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${selected ? "bg-hook" : ""}`}
          >
            <Text className={`text-[13px] font-bold ${selected ? "text-black" : "text-[#77777E]"}`}>{item.label}</Text>
            {counts[item.key] ? (
              <View className={`min-w-5 items-center rounded-full px-1.5 py-0.5 ${selected ? "bg-black/10" : "bg-[#F1F1F3]"}`}>
                <Text className="text-[10px] font-black text-black">{counts[item.key]}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const EMPTY: Record<Segment, { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }> = {
  active: {
    icon: "pricetag",
    title: "No offers in progress",
    body: "Open any product marked Negotiable and make an offer. It will show up here.",
  },
  locked: {
    icon: "lock-closed",
    title: "No locked prices",
    body: "When Hook accepts your offer, the price is locked for a while and you can buy at any quantity.",
  },
  past: {
    icon: "time",
    title: "Nothing here yet",
    body: "Offers that ended or timed out will be kept here.",
  },
};

export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const negotiations = useNegotiationsQuery();
  const locked = useLockedPricesQuery();
  const [now, setNow] = useState(Date.now());
  const [segment, setSegment] = useState<Segment>("active");
  const chosen = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rows = useMemo(() => (Array.isArray(negotiations.data) ? negotiations.data : []) as OfferRow[], [negotiations.data]);
  const prices = useMemo(
    () => (locked.data || []).filter((price) => new Date(price.expiresAt).getTime() > now),
    [locked.data, now],
  );
  const lockedProductIds = useMemo(() => new Set(prices.map((price) => price.productId)), [prices]);

  const active = rows.filter((row) => isNegotiationActive(row, now));
  // A negotiation that ended in a locked price that is still usable lives under Locked, not Past.
  const past = rows.filter((row) => !isNegotiationActive(row, now) && !(row.status === "agreed" && row.product?.id && lockedProductIds.has(row.product.id)));
  const counts: Record<Segment, number> = { active: active.length, locked: prices.length, past: past.length };

  // Open on whatever matters most once, then leave the customer's own choice alone.
  useEffect(() => {
    if (chosen.current || negotiations.isLoading || locked.isLoading) return;
    chosen.current = true;
    setSegment(active.length ? "active" : prices.length ? "locked" : "active");
  }, [negotiations.isLoading, locked.isLoading, active.length, prices.length]);

  const loading = negotiations.isLoading;
  const empty = counts[segment] === 0;
  const refreshing = negotiations.isRefetching || locked.isRefetching;

  return (
    <View className="flex-1 bg-[#F1F1F3]" style={{ paddingTop: insets.top }}>
      <View className="px-4 pb-4 pt-3">
        <View className="flex-row items-center justify-between">
          <HookBackButton />
          <Text className="text-[22px] font-black text-[#0A0A0A]">Offers</Text>
          <View className="size-11" />
        </View>
        <Text className="mt-3 text-center text-[13px] text-[#77777E]">
          Your price offers and the prices you have locked
        </Text>
      </View>

      <SegmentControl value={segment} onChange={setSegment} counts={counts} />

      {loading ? (
        <View className="flex-1 pt-4">
          <SkeletonRows count={4} label="Loading offers" />
        </View>
      ) : (
        <ScrollView
          className="mt-4 flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void Promise.all([negotiations.refetch(), locked.refetch()])}
              tintColor="#111"
              colors={["#FFC809"]}
            />
          }
          contentContainerStyle={{
            flexGrow: empty ? 1 : undefined,
            paddingBottom: getHookTabBarContentInset(insets.bottom),
          }}
        >
          {empty ? (
            <View className="flex-1 items-center justify-center px-10 pb-20">
              <View className="size-20 items-center justify-center rounded-[24px] bg-[#FFF3BF]">
                <Ionicons name={EMPTY[segment].icon} size={32} color="#111" />
              </View>
              <Text className="mt-6 text-center text-[20px] font-black">{EMPTY[segment].title}</Text>
              <Text className="mt-2 text-center text-sm leading-6 text-[#77777E]">{EMPTY[segment].body}</Text>
              {segment !== "past" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/(tabs)/discover" as never)}
                  className="mt-6 h-12 items-center justify-center rounded-full bg-hook px-6"
                >
                  <Text className="text-[14px] font-bold">Browse products</Text>
                </Pressable>
              ) : null}
            </View>
          ) : segment === "active" ? (
            active.map((row, index) => (
              <Reveal key={row.negotiationId} index={index}>
                <ActiveOfferCard row={row} now={now} />
              </Reveal>
            ))
          ) : segment === "locked" ? (
            prices.map((price, index) => (
              <Reveal key={price.quoteId} index={index}>
                <LockedPriceCard price={price} now={now} />
              </Reveal>
            ))
          ) : (
            past.map((row, index) => {
              // A small heading each time the day changes, so a long history stays easy to scan.
              const day = dayLabel(row.updatedAt || row.createdAt, now);
              const previous = index ? dayLabel(past[index - 1].updatedAt || past[index - 1].createdAt, now) : undefined;
              return (
                <Reveal key={row.negotiationId} index={index}>
                  {day !== previous ? (
                    <Text className="mx-5 mb-2 mt-1 text-[12px] font-bold uppercase text-[#8F8F95]">{day}</Text>
                  ) : null}
                  <PastOfferCard row={row} now={now} />
                </Reveal>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
