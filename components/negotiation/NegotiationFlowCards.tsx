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

/** Turns what the customer typed into kobo. Digits only; undefined when empty or not a number. */
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
    if (flow.counter) {
      return flow.priceAccepted
        ? `Hook already accepted ${negotiationMoney(flow.counter.totalMinor)}. Offer less to try for a better price.`
        : `Hook already offered ${negotiationMoney(flow.counter.totalMinor)}. Offer less, or accept it.`;
    }
    return `That is at or above the list price of ${negotiationMoney(flow.listTotalMinor)}.`;
  }
  if (flow.bestOffer && totalMinor <= flow.bestOffer.totalMinor)
    return `Offer more than your last ${negotiationMoney(flow.bestOffer.totalMinor)}`;
  return undefined;
}

type PillTone = "neutral" | "good" | "warn";

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: PillTone }) {
  const box = tone === "good" ? "bg-[#E5F4E7]" : tone === "warn" ? "bg-[#FFF1D6]" : "bg-[#EDEDF0]";
  const text = tone === "good" ? "text-[#287B35]" : tone === "warn" ? "text-[#8A5A00]" : "text-[#555]";
  return (
    <View className={`rounded-full px-2.5 py-1 ${box}`}>
      <Text className={`text-[11px] font-semibold ${text}`}>{children}</Text>
    </View>
  );
}

/**
 * The rules of the moment, always visible: the list price, how many offers are left, and only the pressure that is
 * true (a final offer, a session that really is about to end).
 */
export function FlowSummaryStrip({ flow }: { flow: NegotiationFlow }) {
  const active = flow.status === "active";
  const seconds = useCountdown(active ? flow.expiresAt : undefined);
  return (
    <View className="mx-4 mb-3 flex-row flex-wrap items-center gap-2">
      <Pill>List price {negotiationMoney(flow.listTotalMinor)}</Pill>
      {active ? (
        flow.lastRound ? (
          <Pill tone="warn">Final offer</Pill>
        ) : (
          <Pill tone="good">
            {flow.remainingOffers} {flow.remainingOffers === 1 ? "offer" : "offers"} left
          </Pill>
        )
      ) : null}
      {seconds !== undefined && seconds > 0 ? (
        <Pill tone={seconds <= 120 ? "warn" : "neutral"}>Ends in {clock(seconds)}</Pill>
      ) : null}
    </View>
  );
}

/** The customer's price, typed first: large, with what it means (per item, % off) and any rule it breaks. */
export function OfferAmountField({
  value,
  onChange,
  flow,
  problem,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  flow: NegotiationFlow;
  problem?: string;
  autoFocus?: boolean;
}) {
  const total = parseNairaToMinor(value);
  const unit = total ? Math.round(total / flow.quantity) : undefined;
  return (
    <View className="rounded-[20px] bg-white p-4">
      <Text className="text-[12px] font-semibold text-[#555]">Your price for {itemsLabel(flow.quantity)}</Text>
      <View className={`mt-2 h-14 flex-row items-center rounded-2xl border px-4 ${problem ? "border-red-300" : "border-black/10"}`}>
        <Text className="mr-1.5 text-[22px] font-black">₦</Text>
        <TextInput
          accessibilityLabel="Your offer"
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#bbb"
          maxLength={12}
          autoFocus={autoFocus}
          className="flex-1 text-[22px] font-black"
        />
      </View>
      {problem ? (
        <Text accessibilityLiveRegion="polite" className="mt-2 text-[12px] text-[#B42318]">{problem}</Text>
      ) : unit && total ? (
        <Text className="mt-2 text-[12px] text-[#666]">
          {[eachLabel(unit, flow.quantity), `${Math.max(0, Math.round(((flow.listUnitMinor - unit) / flow.listUnitMinor) * 1000) / 10)}% off the list price`].filter(Boolean).join(" · ")}
        </Text>
      ) : (
        <Text className="mt-2 text-[12px] text-[#888]">
          Between {negotiationMoney(flow.minTotalMinor)} and {negotiationMoney(flow.maxTotalMinor)}
        </Text>
      )}
    </View>
  );
}

/** A short beat while Hook "thinks", so the answer feels like an answer and not a page refresh. */
const THINKING = ["Checking with the seller…", "Running the numbers…", "Seeing what we can do…"];

export function ConsideringCard({ offerTotalMinor }: { offerTotalMinor: number }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((value) => (value + 1) % THINKING.length), 650);
    return () => clearInterval(timer);
  }, []);
  return (
    <View accessibilityLiveRegion="polite" className="mx-4 items-center rounded-[20px] bg-white p-6">
      <Text className="text-[12px] text-[#777]">You offered</Text>
      <Text className="text-[26px] font-black">{negotiationMoney(offerTotalMinor)}</Text>
      <View className="mt-4 flex-row items-center gap-2">
        <View className="size-2 rounded-full bg-hook" />
        <Text className="text-[13px] font-semibold text-[#555]">Hook is considering your offer</Text>
      </View>
      <Text className="mt-1 text-[12px] text-[#888]">{THINKING[step]}</Text>
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
      {flow.lastRound ? (
        <Text className="mt-3 text-[12px] font-semibold text-[#8A5A00]">You have one offer left. Make it count.</Text>
      ) : null}
    </View>
  );
}

/**
 * Hook has said yes to a price, but it is not locked: the customer still has offers and decides whether to lock it or
 * try for less. Nothing is locked until they choose, or until their last offer is used.
 */
export function AcceptedCard({ flow, note }: { flow: NegotiationFlow; note?: string }) {
  if (!flow.counter) return null;
  const each = eachLabel(flow.counter.unitMinor, flow.quantity);
  return (
    <View className="mx-4 rounded-[20px] bg-white p-4">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name="checkmark-circle" size={15} color="#287B35" />
        <Text className="text-[12px] font-bold text-[#287B35]">Hook accepts this price</Text>
      </View>
      <Text className="mt-1 text-[30px] font-black">{negotiationMoney(flow.counter.totalMinor)}</Text>
      <Text className="mt-0.5 text-[13px] text-[#666]">
        {[each, `${flow.counter.percentOff}% off`, flow.quantity > 1 ? `for ${itemsLabel(flow.quantity)}` : undefined].filter(Boolean).join(" · ")}
      </Text>
      {note ? <Text className="mt-3 text-[13px] leading-5 text-[#555]">{note}</Text> : null}
      <View className="mt-3 rounded-xl bg-[#F7F7F8] px-3 py-2.5">
        <Text className="text-[12px] leading-[17px] text-[#555]">
          It is not locked yet. You still have {flow.remainingOffers} {flow.remainingOffers === 1 ? "offer" : "offers"}: lock it
          now, or try for a lower price. Hook keeps this price for you if a try falls short.
        </Text>
      </View>
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

/**
 * The negotiation as a ladder: each of your offers beside Hook's answer, the offers used so far, and how far apart you
 * still are. It shows the back-and-forth that is really happening.
 */
export function OfferLadder({ flow }: { flow: NegotiationFlow }) {
  if (!flow.history.length) return null;
  const latest = flow.history[flow.history.length - 1];
  const gap = latest.decision === "COUNTER" && latest.counterTotalMinor ? latest.counterTotalMinor - latest.offerTotalMinor : undefined;
  const open = flow.status === "active" && flow.remainingOffers > 0;
  return (
    <View className="mx-4 mt-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[12px] font-bold uppercase text-[#888]">The negotiation</Text>
        <View accessibilityLabel={`${flow.history.length} of ${flow.maximumOffers} offers used`} className="flex-row gap-1">
          {Array.from({ length: flow.maximumOffers }).map((_, index) => (
            <View key={index} className={`size-2 rounded-full ${index < flow.history.length ? "bg-hook" : "bg-[#D9D9DE]"}`} />
          ))}
        </View>
      </View>
      <View className="rounded-2xl bg-white px-3.5 py-1.5">
        {flow.history.map((entry, index) => {
          const accepted = entry.decision === "ACCEPT";
          return (
            <View key={entry.round} className={`flex-row items-center py-3 ${index > 0 ? "border-t border-black/5" : ""}`}>
              <View className="flex-1">
                <Text className="text-[11px] text-[#888]">You · offer {entry.round}</Text>
                <Text className="text-[15px] font-bold">{negotiationMoney(entry.offerTotalMinor)}</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color="#B0B0B5" />
              <View className="flex-1 items-end">
                <Text className="text-[11px] text-[#888]">Hook</Text>
                <Text className={`text-[15px] font-bold ${accepted ? "text-[#287B35]" : ""}`}>
                  {accepted
                    ? `Accepted ${negotiationMoney(entry.acceptedTotalMinor || entry.offerTotalMinor)}`
                    : entry.counterTotalMinor
                      ? negotiationMoney(entry.counterTotalMinor)
                      : "—"}
                </Text>
              </View>
            </View>
          );
        })}
        {open ? (
          <View className="flex-row items-center border-t border-dashed border-black/10 py-3">
            <View className="flex-1">
              <Text className="text-[11px] text-[#888]">You · offer {flow.history.length + 1}</Text>
              <Text className="text-[14px] font-semibold text-[#A0A0A6]">Your move</Text>
            </View>
          </View>
        ) : null}
      </View>
      {gap && gap > 0 ? (
        <Text className="mt-2 text-center text-[12px] text-[#777]">
          {negotiationMoney(gap)} apart{flow.quantity > 1 ? ` for ${itemsLabel(flow.quantity)}` : ""}
        </Text>
      ) : null}
    </View>
  );
}
