import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { NegotiationFlow } from "@/lib/negotiation-types";
import { negotiationMoney } from "./NegotiationComponents";

/** "both items", "all 3 items", "this item": every price on screen says what it is for. */
export function itemsLabel(quantity: number) {
  if (quantity <= 1) return "this item";
  return quantity === 2 ? "both items" : `all ${quantity} items`;
}

const eachLabel = (unitMinor: number, quantity: number) =>
  quantity > 1 ? `${negotiationMoney(unitMinor)} each` : undefined;

/** Seconds left until `expiresAt`, ticking once a second. Undefined when there is no deadline. */
export function useCountdown(expiresAt?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  if (!expiresAt) return undefined;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

export const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Turns what the customer typed into kobo. Digits and commas only; undefined when empty or not a number. */
export function parseNairaToMinor(text: string) {
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const naira = Number(digits);
  return Number.isSafeInteger(naira) && naira > 0 ? naira * 100 : undefined;
}

/** The same rules the server enforces, so mistakes are caught while typing. */
export function offerProblem(totalMinor: number | undefined, flow: NegotiationFlow) {
  if (!totalMinor) return undefined;
  if (totalMinor < flow.minTotalMinor) return `Offers start at ${negotiationMoney(flow.minTotalMinor)}`;
  if (totalMinor >= flow.maxTotalMinor) {
    return flow.counter
      ? `Hook already offered ${negotiationMoney(flow.counter.totalMinor)}. Offer less, or accept it.`
      : `That is at or above the list price of ${negotiationMoney(flow.listTotalMinor)}.`;
  }
  if (flow.bestOffer && totalMinor <= flow.bestOffer.totalMinor)
    return `Offer more than your last ${negotiationMoney(flow.bestOffer.totalMinor)}`;
  return undefined;
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" }) {
  return (
    <View className={`rounded-full px-2.5 py-1 ${tone === "good" ? "bg-[#E5F4E7]" : "bg-[#EDEDF0]"}`}>
      <Text className={`text-[11px] font-semibold ${tone === "good" ? "text-[#287B35]" : "text-[#555]"}`}>{children}</Text>
    </View>
  );
}

/** List price and how many offers are left, always visible so the rules are never a surprise. */
export function FlowSummaryStrip({ flow }: { flow: NegotiationFlow }) {
  return (
    <View className="mx-4 mb-3 flex-row flex-wrap items-center gap-2">
      <Pill>List price {negotiationMoney(flow.listTotalMinor)}</Pill>
      {flow.status === "active" ? (
        <Pill tone="good">
          {flow.remainingOffers} {flow.remainingOffers === 1 ? "offer" : "offers"} left
        </Pill>
      ) : null}
    </View>
  );
}

export function SuggestionCard({
  suggestion,
  quantity,
  selected,
  onPress,
}: {
  suggestion: NegotiationFlow["suggestions"][number];
  quantity: number;
  selected: boolean;
  onPress: () => void;
}) {
  const each = eachLabel(suggestion.unitMinor, quantity);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-2xl bg-white p-3.5 ${selected ? "border-2 border-hook" : "border-2 border-transparent"}`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[18px] font-black">{negotiationMoney(suggestion.totalMinor)}</Text>
          <Text className="mt-0.5 text-[12px] text-[#666]">
            {[each, `${suggestion.percentOff}% off`].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View className={`size-6 items-center justify-center rounded-full ${selected ? "bg-hook" : "border border-black/20"}`}>
          {selected ? <Ionicons name="checkmark" size={16} color="#111" /> : null}
        </View>
      </View>
      {suggestion.note ? <Text className="mt-2 text-[12px] leading-4 text-[#777]">{suggestion.note}</Text> : null}
    </Pressable>
  );
}

export function CustomOfferField({
  value,
  onChange,
  onFocus,
  flow,
  problem,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  flow: NegotiationFlow;
  problem?: string;
}) {
  const total = parseNairaToMinor(value);
  const unit = total ? Math.round(total / flow.quantity) : undefined;
  return (
    <View className="rounded-2xl bg-white p-3.5">
      <Text className="text-[12px] font-semibold text-[#555]">Or enter your own total for {itemsLabel(flow.quantity)}</Text>
      <View className={`mt-2 h-12 flex-row items-center rounded-xl border px-3 ${problem ? "border-red-300" : "border-black/10"}`}>
        <Text className="mr-1 text-[16px] font-bold">₦</Text>
        <TextInput
          accessibilityLabel="Your offer"
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^\d,]/g, ""))}
          onFocus={onFocus}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#aaa"
          maxLength={12}
          className="flex-1 text-[16px] font-bold"
        />
      </View>
      {problem ? (
        <Text accessibilityLiveRegion="polite" className="mt-2 text-[12px] text-[#B42318]">{problem}</Text>
      ) : unit && total ? (
        <Text className="mt-2 text-[12px] text-[#666]">
          {[eachLabel(unit, flow.quantity), `${Math.max(0, Math.round(((flow.listUnitMinor - unit) / flow.listUnitMinor) * 1000) / 10)}% off`].filter(Boolean).join(" · ")}
        </Text>
      ) : (
        <Text className="mt-2 text-[12px] text-[#888]">
          Between {negotiationMoney(flow.minTotalMinor)} and {negotiationMoney(flow.maxTotalMinor)}
        </Text>
      )}
    </View>
  );
}

/** Hook's answer to the last offer: one number, never a conversation. */
export function CounterCard({
  flow,
  offerTotalMinor,
  note,
}: {
  flow: NegotiationFlow;
  offerTotalMinor?: number;
  note?: string;
}) {
  if (!flow.counter) return null;
  const each = eachLabel(flow.counter.unitMinor, flow.quantity);
  return (
    <View className="mx-4 rounded-[20px] bg-white p-4">
      {offerTotalMinor ? (
        <>
          <Text className="text-[12px] text-[#777]">You offered</Text>
          <Text className="text-[15px] font-bold text-[#999] line-through">{negotiationMoney(offerTotalMinor)}</Text>
        </>
      ) : null}
      <Text className="mt-3 text-[12px] text-[#777]">Hook can do</Text>
      <Text className="text-[30px] font-black">{negotiationMoney(flow.counter.totalMinor)}</Text>
      <Text className="mt-0.5 text-[13px] text-[#666]">
        {[each, `${flow.counter.percentOff}% off`, flow.quantity > 1 ? `for ${itemsLabel(flow.quantity)}` : undefined].filter(Boolean).join(" · ")}
      </Text>
      {note ? <Text className="mt-3 text-[13px] leading-5 text-[#555]">{note}</Text> : null}
    </View>
  );
}

export function LockedCard({ flow, quantity, note }: { flow: NegotiationFlow; quantity: number; note?: string }) {
  const seconds = useCountdown(flow.locked?.expiresAt);
  if (!flow.locked) return null;
  // The locked price is per item and holds at any quantity, so the total follows the quantity chosen.
  const total = flow.locked.unitMinor * quantity;
  const savings = Math.max(0, (flow.listUnitMinor - flow.locked.unitMinor) * quantity);
  const each = eachLabel(flow.locked.unitMinor, Math.max(2, quantity));
  return (
    <View className="mx-4 rounded-[20px] bg-[#E5F4E7] p-4">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name="lock-closed" size={14} color="#287B35" />
        <Text className="text-[12px] font-bold text-[#287B35]">Price locked</Text>
      </View>
      <Text className="mt-1 text-[30px] font-black text-[#1B5E27]">{negotiationMoney(total)}</Text>
      <Text className="text-[13px] text-[#287B35]">
        {[quantity > 1 ? `for ${itemsLabel(quantity)}` : undefined, each, savings > 0 ? `you save ${negotiationMoney(savings)}` : undefined].filter(Boolean).join(" · ")}
      </Text>
      <Text className="mt-1 text-[12px] text-[#2F6B3A]">Buy any quantity at this price until the timer ends.</Text>
      {note ? <Text className="mt-3 text-[13px] leading-5 text-[#2F6B3A]">{note}</Text> : null}
      {seconds !== undefined ? (
        <View className="mt-4 flex-row items-center justify-between rounded-xl bg-white/70 px-3 py-2.5">
          <Text className="text-[12px] text-[#555]">Time left to buy</Text>
          <Text className="text-[14px] font-black">{seconds > 0 ? clock(seconds) : "Expired"}</Text>
        </View>
      ) : null}
    </View>
  );
}

const ENDED: Record<string, string> = {
  PRODUCT_UNAVAILABLE: "This product is no longer available, so the negotiation ended.",
  NEGOTIATION_DISABLED: "This product is no longer open for negotiation.",
  DUPLICATE_SESSION: "This negotiation was replaced by a newer one.",
};

export function EndedCard({ flow }: { flow: NegotiationFlow }) {
  const text = flow.quoteCancelled
    ? "This product changed, so your locked price was cancelled. You can start again at the current price."
    : (flow.endReason && ENDED[flow.endReason]) ||
      (flow.status === "expired"
        ? "This negotiation timed out. Start a new one whenever you are ready."
        : "This negotiation has ended. Start a new one whenever you are ready.");
  return (
    <View className="mx-4 items-center rounded-[20px] bg-white p-5">
      <View className="mb-2 size-11 items-center justify-center rounded-full bg-[#EDEDF0]">
        <Ionicons name="time-outline" size={22} color="#555" />
      </View>
      <Text className="text-center text-[14px] leading-5 text-[#555]">{text}</Text>
    </View>
  );
}

export function OfferHistory({ flow }: { flow: NegotiationFlow }) {
  if (!flow.history.length) return null;
  return (
    <View className="mx-4 mt-4">
      <Text className="mb-2 text-[12px] font-bold uppercase text-[#888]">Your offers</Text>
      <View className="rounded-2xl bg-white">
        {flow.history.map((entry, index) => (
          <View
            key={entry.round}
            className={`flex-row items-center justify-between px-3.5 py-3 ${index > 0 ? "border-t border-black/5" : ""}`}
          >
            <View>
              <Text className="text-[11px] text-[#888]">Offer {entry.round}</Text>
              <Text className="text-[14px] font-bold">{negotiationMoney(entry.offerTotalMinor)}</Text>
            </View>
            <Text className="text-[12px] font-semibold text-[#555]">
              {entry.decision === "ACCEPT"
                ? `Accepted ${negotiationMoney(entry.acceptedTotalMinor || entry.offerTotalMinor)}`
                : entry.counterTotalMinor
                  ? `Hook: ${negotiationMoney(entry.counterTotalMinor)}`
                  : entry.decision === "DECLINE"
                    ? "Too low"
                    : ""}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
