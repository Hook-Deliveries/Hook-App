import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { KeyboardStickyView, useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { centeredHeaderTextStyle } from "@/constants/design-tokens";
import { HookBackButton } from "@/components/shared/HookBackButton";
import { HookConfirmSheet } from "@/components/shared/HookConfirmSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { HookRefreshControl } from "@/components/shared/HookRefreshControl";
import { toast } from "@/components/shared/toast";
import { usePullRefresh } from "@/hooks/use-pull-refresh";
import { ApiError } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import {
  mobileQueryKeys,
  useAcceptNegotiationMutation,
  useActiveNegotiationQuery,
  useAddCartItemMutation,
  useCloseNegotiationMutation,
  useNegotiationFlowQuery,
  useProductQuery,
  useStartNegotiationMutation,
  useSubmitOfferTotalMutation,
} from "@/lib/mobile-api";
import type { NegotiationOfferOutcome, NegotiationResponse } from "@/lib/negotiation-types";
import { NegotiationOptionsSheet } from "./NegotiationOptionsSheet";
import { NegotiationProductSummary, negotiationMoney } from "./NegotiationComponents";
import {
  CounterCard,
  CustomOfferField,
  EndedCard,
  FlowSummaryStrip,
  LockedCard,
  OfferHistory,
  SuggestionCard,
  itemsLabel,
  offerProblem,
  parseNairaToMinor,
} from "./NegotiationFlowCards";

/** Errors that mean "this will fail the same way if you try again": say so, then refresh what the screen shows. */
const STALE_CODES = ["NEGOTIATION_PRODUCT_UNAVAILABLE", "INVALID_STATE_TRANSITION", "OFFER_LIMIT_REACHED", "NEGOTIATION_QUOTE_EXPIRED"];

type Mode = "intro" | "loading" | "pick" | "counter" | "accepted" | "locked" | "ended";

/**
 * Negotiation as a short task, not a chat: pick or enter a price, see Hook's answer on a card, then add the locked
 * price to the cart. Every price is shown as a total for the whole quantity (with the per-item price beside it).
 * The server decides every price; this screen only presents them.
 */
export default function NegotiationScreen() {
  const params = useLocalSearchParams<{ productId?: string; variantId?: string; quantity?: string; resume?: string }>();
  const [quantity, setQuantity] = useState(Math.min(20, Math.max(1, Number(params.quantity) || 1)));
  const [contextProductId, setContextProductId] = useState(params.productId);
  const [contextVariantId, setContextVariantId] = useState(params.variantId);
  const [sessionId, setSessionId] = useState(params.resume);

  const active = useActiveNegotiationQuery(contextProductId, contextVariantId, quantity);
  const flowQuery = useNegotiationFlowQuery(sessionId);
  const flow = flowQuery.data;
  const productQuery = useProductQuery(flow?.productId || contextProductId);
  const product = productQuery.data;
  const start = useStartNegotiationMutation();
  const submit = useSubmitOfferTotalMutation();
  const accept = useAcceptNegotiationMutation();
  const close = useCloseNegotiationMutation();
  const addCart = useAddCartItemMutation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  const { refreshing, onRefresh } = usePullRefresh(() => flowQuery.refetch());

  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<number>();
  const [custom, setCustom] = useState("");
  const [outcome, setOutcome] = useState<NegotiationOfferOutcome["result"]>();
  const [added, setAdded] = useState(false);
  // Once a price is locked it holds at any quantity, so the customer picks how many to add.
  const [cartQuantity, setCartQuantity] = useState<number>();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [nextQuantity, setNextQuantity] = useState<number>();
  const [closePrompt, setClosePrompt] = useState(false);
  const requestIds = useRef(new Map<string, string>());

  const optionsRequired = !sessionId && !contextVariantId;
  useEffect(() => {
    if (product && optionsRequired) setOptionsVisible(true);
  }, [product, optionsRequired]);

  // Pick up a session that is already running for this item instead of asking the customer to start another.
  useEffect(() => {
    if (!sessionId && active.data?.negotiationId) setSessionId(active.data.negotiationId);
  }, [active.data, sessionId]);

  const mode: Mode = !sessionId
    ? "intro"
    : !flow
      ? "loading"
      : flow.status === "active"
        ? outcome?.decision === "ACCEPT"
          ? "accepted"
          : flow.counter && !picking
            ? "counter"
            : "pick"
        : flow.status === "agreed" && flow.locked
          ? "locked"
          : "ended";

  const customTotal = parseNairaToMinor(custom);
  const selectedTotal = flow && selected !== undefined ? flow.suggestions[selected]?.totalMinor : customTotal;
  const problem = flow && selected === undefined ? offerProblem(customTotal, flow) : undefined;
  const canOffer = Boolean(selectedTotal) && !problem && !submit.isPending;
  const quantityShown = mode === "locked" ? cartQuantity ?? flow?.quantity ?? quantity : flow?.quantity || quantity;
  const busy = start.isPending || submit.isPending || accept.isPending || close.isPending || addCart.isPending;

  function resetPick() {
    setPicking(false);
    setSelected(undefined);
    setCustom("");
  }

  /** Opens a session in place. The new session's prices load into the area below; nothing else on screen reloads. */
  async function startNegotiation() {
    if (start.isPending) return;
    if (optionsRequired) return setOptionsVisible(true);
    if (!contextProductId || !contextVariantId) return toast.error("Choose product colour and size before negotiating.");
    const adopt = (result: NegotiationResponse) => {
      queryClient.setQueryData(mobileQueryKeys.negotiation(result.negotiationId), result);
      resetPick();
      setOutcome(undefined);
      setAdded(false);
      setCartQuantity(undefined);
      setSessionId(result.negotiationId);
      haptics.select();
    };
    try {
      adopt(await start.mutateAsync({ productId: contextProductId, variantId: contextVariantId, quantity: quantityShown }));
    } catch (error) {
      if (error instanceof ApiError && error.code === "ACTIVE_NEGOTIATION_EXISTS") return adopt(error.data as NegotiationResponse);
      toast.error(error instanceof Error ? error.message : "Could not start the negotiation");
    }
  }

  async function submitOffer() {
    if (!flow || !selectedTotal || !canOffer) return;
    // The same offer keeps the same request id, so a retry after a dropped connection never spends a second round.
    const key = `${flow.negotiationId}:${flow.round}:${selectedTotal}`;
    const requestId = requestIds.current.get(key) ?? Crypto.randomUUID();
    requestIds.current.set(key, requestId);
    Keyboard.dismiss();
    try {
      const result = await submit.mutateAsync({ negotiationId: flow.negotiationId, totalPriceMinor: selectedTotal, requestId });
      setOutcome(result.result);
      resetPick();
      haptics.success();
    } catch (error) {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(error instanceof Error ? error.message : "Could not send your offer");
      if (code && STALE_CODES.includes(code)) void flowQuery.refetch();
    }
  }

  async function acceptPrice() {
    if (!flow) return;
    try {
      await accept.mutateAsync(flow.negotiationId);
      await flowQuery.refetch();
      setOutcome(undefined);
      haptics.success();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not lock this price");
      void flowQuery.refetch();
    }
  }

  async function keepListPrice() {
    if (!flow) return;
    try {
      await close.mutateAsync(flow.negotiationId);
    } catch {
      // The negotiation may already be over; going back is still right.
    }
    router.back();
  }

  async function addToCart() {
    if (!flow?.locked || !product || !flow.variantId) return;
    try {
      await addCart.mutateAsync({
        productId: product.publicId,
        variantId: flow.variantId,
        quantity: cartQuantity ?? flow.quantity,
        quoteId: flow.locked.quoteId,
      });
      setAdded(true);
      toast.success("Added to your cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this to your cart");
      void flowQuery.refetch();
    }
  }

  const footerPad = keyboardVisible ? 8 : Math.max(insets.bottom, 12);

  return (
    <View className="flex-1 bg-[#F1F1F3]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <HookBackButton />
        <Text style={centeredHeaderTextStyle}>Negotiate</Text>
        <Pressable
          accessibilityRole="button"
          disabled={mode === "intro" || flow?.status !== "active"}
          onPress={() => setClosePrompt(true)}
          className="h-11 justify-center px-2 disabled:opacity-30"
        >
          <Text className="text-xs font-bold">Close</Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        refreshControl={<HookRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <NegotiationProductSummary
          product={product}
          quantity={quantityShown}
          onQuantity={(value) => (mode === "locked" ? (setCartQuantity(value), setAdded(false)) : setNextQuantity(value))}
          unitPriceMinor={mode === "locked" ? flow?.locked?.unitMinor : undefined}
          maxQuantity={mode === "locked" ? 99 : 20}
          onPreview={() => product && router.push(`/products/${product.publicId}` as never)}
          status={flow?.status}
        />
        {flow ? <FlowSummaryStrip flow={flow} /> : null}

        {/* One body that changes in place: no screen swap, no reload. */}
        <Animated.View key={mode} entering={FadeIn.duration(reducedMotion ? 0 : 180)} className="gap-3">
          {mode === "intro" ? (
            <View className="mx-4 rounded-[20px] bg-white p-5">
              <Text className="text-[16px] font-bold">Name your price</Text>
              <Text className="mt-1.5 text-[13px] leading-5 text-[#666]">
                Start a negotiation to see prices Hook may accept for {itemsLabel(quantityShown)}. Pick one, or enter your own.
              </Text>
            </View>
          ) : null}

          {mode === "loading" ? (
            <View className="items-center py-10">
              <HookLoader size="inline" label="Preparing prices" />
            </View>
          ) : null}

          {mode === "pick" && flow ? (
            <View className="mx-4 gap-3">
              <Text className="text-[15px] font-bold">
                {flow.history.length ? "Make another offer" : `Pick a price for ${itemsLabel(flow.quantity)}`}
              </Text>
              {flow.counter ? (
                <Text className="-mt-1 text-[12px] text-[#666]">
                  Hook's price is {negotiationMoney(flow.counter.totalMinor)}. Offer less to keep negotiating.
                </Text>
              ) : null}
              {flow.suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={suggestion.totalMinor}
                  suggestion={suggestion}
                  quantity={flow.quantity}
                  selected={selected === index}
                  onPress={() => {
                    haptics.select();
                    Keyboard.dismiss();
                    setSelected(index);
                    setCustom("");
                  }}
                />
              ))}
              <CustomOfferField
                value={custom}
                onChange={(text) => {
                  setCustom(text);
                  setSelected(undefined);
                }}
                onFocus={() => setSelected(undefined)}
                flow={flow}
                problem={problem}
              />
            </View>
          ) : null}

          {mode === "counter" && flow ? (
            <CounterCard flow={flow} offerTotalMinor={flow.history[flow.history.length - 1]?.offerTotalMinor} note={outcome?.message} />
          ) : null}

          {mode === "accepted" && flow ? (
            <View className="mx-4 rounded-[20px] bg-white p-4">
              <Text className="text-[12px] text-[#777]">Hook accepted</Text>
              <Text className="text-[30px] font-black">{negotiationMoney(outcome?.acceptedTotalMinor || 0)}</Text>
              <Text className="mt-2 text-[13px] leading-5 text-[#555]">
                {outcome?.lockError || "Lock this price to add it to your cart."}
              </Text>
            </View>
          ) : null}

          {mode === "locked" && flow ? <LockedCard flow={flow} quantity={quantityShown} note={outcome?.message} /> : null}

          {mode === "ended" && flow ? <EndedCard flow={flow} /> : null}

          {flow && mode !== "pick" ? <OfferHistory flow={flow} /> : null}
        </Animated.View>
      </ScrollView>

      <KeyboardStickyView
        offset={{ closed: 0, opened: 0 }}
        className="gap-2 border-t border-black/5 bg-[#F1F1F3] px-4 pt-3"
        style={{ paddingBottom: footerPad }}
      >
        {optionsRequired ? (
          <Action label="Choose colour and size" onPress={() => setOptionsVisible(true)} />
        ) : mode === "intro" || mode === "ended" ? (
          <Action
            label={mode === "ended" ? "Start a new negotiation" : "Start negotiation"}
            icon="pricetag"
            busy={start.isPending}
            onPress={() => void startNegotiation()}
          />
        ) : mode === "pick" ? (
          <Action
            label={selectedTotal && canOffer ? `Offer ${negotiationMoney(selectedTotal)} for ${itemsLabel(quantityShown)}` : "Pick a price to offer"}
            busy={submit.isPending}
            disabled={!canOffer}
            onPress={() => void submitOffer()}
          />
        ) : mode === "counter" && flow?.counter ? (
          <>
            <Action label={`Accept ${negotiationMoney(flow.counter.totalMinor)}`} busy={accept.isPending} onPress={() => void acceptPrice()} />
            {flow.remainingOffers > 0 ? (
              <Action label={`Try another price · ${flow.remainingOffers} left`} tone="secondary" disabled={busy} onPress={() => setPicking(true)} />
            ) : null}
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void keepListPrice()} className="h-9 items-center justify-center">
              <Text className="text-[12px] font-semibold text-[#666]">Keep list price {negotiationMoney(flow.listTotalMinor)}</Text>
            </Pressable>
          </>
        ) : mode === "accepted" ? (
          <Action label="Lock this price" busy={accept.isPending} onPress={() => void acceptPrice()} />
        ) : mode === "locked" ? (
          <>
            <Action
              label={added ? "View cart" : "Add to cart"}
              icon={added ? "checkmark-circle" : "cart"}
              busy={addCart.isPending}
              onPress={() => (added ? router.push("/(app)/cart" as never) : void addToCart())}
            />
            <Action label="Go to checkout" tone="secondary" disabled={busy} onPress={() => router.push("/checkout")} />
          </>
        ) : null}
      </KeyboardStickyView>

      {product && optionsVisible ? (
        <NegotiationOptionsSheet
          visible
          product={product}
          quantity={quantityShown}
          onClose={() => setOptionsVisible(false)}
          onContinue={(variant) => {
            setContextProductId(product.publicId);
            setContextVariantId(variant.publicId);
            setOptionsVisible(false);
          }}
        />
      ) : null}

      <HookConfirmSheet
        visible={nextQuantity !== undefined}
        title="Change quantity?"
        message={`Prices depend on how many you buy. This starts a separate negotiation for ${nextQuantity} item(s); your current one stays as it is.`}
        confirmLabel="Change quantity"
        onClose={() => setNextQuantity(undefined)}
        onConfirm={() => {
          if (nextQuantity) {
            setContextProductId(product?.publicId || contextProductId);
            setContextVariantId(flow?.variantId || contextVariantId);
            setQuantity(nextQuantity);
            setSessionId(undefined);
            setOutcome(undefined);
            setAdded(false);
            setCartQuantity(undefined);
            resetPick();
          }
          setNextQuantity(undefined);
        }}
      />
      <HookConfirmSheet
        visible={closePrompt}
        title="Close this negotiation?"
        message="Your offers so far will not be saved as a price."
        confirmLabel="Close negotiation"
        busy={close.isPending}
        onClose={() => setClosePrompt(false)}
        onConfirm={async () => {
          if (!sessionId) return;
          try {
            await close.mutateAsync(sessionId);
            router.back();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not close negotiation");
          }
        }}
      />
    </View>
  );
}

function Action({
  label,
  onPress,
  icon,
  busy,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  busy?: boolean;
  disabled?: boolean;
  tone?: "primary" | "secondary";
}) {
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      className={`h-12 flex-row items-center justify-center gap-2 rounded-full active:opacity-80 ${
        tone === "primary" ? "bg-hook" : "border border-black/15 bg-white"
      } ${off && !busy ? "opacity-40" : ""}`}
    >
      {busy ? <ActivityIndicator color="#111" /> : icon ? <Ionicons name={icon} size={18} color="#111" /> : null}
      <Text className="text-[15px] font-bold">{label}</Text>
    </Pressable>
  );
}
