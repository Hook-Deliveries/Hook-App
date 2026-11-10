import { addressHandoff } from "@/lib/address-handoff";
import { ClearableInput } from "@/components/shared/ClearableInput";
import { Reveal } from "@/components/motion/Reveal";
import { Ionicons } from "@expo/vector-icons";
import { centeredHeaderTextStyle } from "@/constants/design-tokens";
import { SPRING_PANEL } from "@/constants/motion";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HookConfirmSheet } from "@/components/shared/HookConfirmSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { HookPageLoading } from "@/components/shared/HookPageLoading";
import { HookBackButton } from "@/components/shared/HookBackButton";
import { toast } from "@/components/shared/toast";
import { getApiErrorMessage } from "@/lib/api";
import {
  type CustomerAddressInput,
  type HookOperatingState,
  type PublicLocalGovernment,
  useAddressesQuery,
  useCreateAddressMutation,
  useDefaultAddressMutation,
  useDeleteAddressMutation,
  useLocalGovernmentsQuery,
  useDeliveryStatesQuery,
  useUpdateAddressMutation,
} from "@/lib/mobile-api";

const inputClass = "h-[52px] rounded-full bg-[#F1F1F3] px-5 text-sm text-black";
const textAreaClass = "min-h-[92px] rounded-[22px] bg-[#F1F1F3] px-5 py-3.5 text-sm text-black";

/** Mirrors the backend's addressCreateSchema limits so the field being over-typed stops the user, not a submit error. */
const FIELD_LIMITS = {
  label: 60,
  recipientName: 120,
  line1: 240,
  line2: 240,
  landmark: 240,
  postalCode: 20,
} as const;

type AddressDraft = Omit<CustomerAddressInput, "cityId" | "zoneId"> & {
  cityId?: string;
  zoneId?: string;
  localGovernmentAreaId: string;
};

type AddressRecord = CustomerAddressInput & {
  publicId: string;
  isDefault: boolean;
  status?: string;
};

function emptyDraft(): AddressDraft {
  return {
    label: "Home",
    recipientName: "",
    phone: "",
    line1: "",
    line2: "",
    landmark: "",
    stateId: "",
    cityId: undefined,
    zoneId: undefined,
    postalCode: "",
    formattedAddress: "",
    stateCode: "",
    stateName: "",
    cityName: "",
    localGovernmentAreaId: "",
    localGovernmentArea: "",
    isDefault: false,
  };
}

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const addresses = useAddressesQuery();
  const states = useDeliveryStatesQuery();
  const create = useCreateAddressMutation();
  const update = useUpdateAddressMutation();
  const remove = useDeleteAddressMutation();
  const makeDefault = useDefaultAddressMutation();

  const params = useLocalSearchParams<{ new?: string; from?: string }>();
  // Opened from checkout's "Add new address": the wizard starts at once and leaving it returns to checkout.
  const cameFromCheckout = useRef(params.from === "checkout");
  const [wizardOpen, setWizardOpen] = useState(params.new === "1");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AddressDraft>(emptyDraft());
  // What the wizard opened with, so closing can tell "nothing entered yet" from "would lose work".
  const openedWith = useRef(JSON.stringify(emptyDraft()));
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressToRemove, setAddressToRemove] = useState<{ id: string; label: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const openRowId = useRef<string | null>(null);
  const closeRow = useRef<(() => void) | null>(null);

  /** Closes the wizard; when it was opened from checkout there is nothing to stay on this page for, so go back there. */
  function closeWizard() {
    setWizardOpen(false);
    if (cameFromCheckout.current) {
      cameFromCheckout.current = false;
      router.back();
    }
  }

  // Each step starts at the top, and a keyboard left open by the last step never carries over.
  useEffect(() => { Keyboard.dismiss(); }, [step]);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardUp(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardUp(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  function registerRowOpen(id: string, close: () => void) {
    if (openRowId.current && openRowId.current !== id) closeRow.current?.();
    openRowId.current = id;
    closeRow.current = close;
  }

  function registerRowClosed(id: string) {
    if (openRowId.current === id) {
      openRowId.current = null;
      closeRow.current = null;
    }
  }

  const addressRows = (addresses.data || []) as AddressRecord[];
  const stateRows = (states.data || []) as HookOperatingState[];
  const selectedState = stateRows.find((state) => state.publicId === draft.stateId);
  const localGovernments = useLocalGovernmentsQuery(draft.stateId);
  // Rows are nested under .data.data, not the query result's top-level .data.
  const localGovernmentRows = (localGovernments.data?.data || []) as PublicLocalGovernment[];
  const saving = create.isPending || update.isPending;

  function showAddressError(message: string) {
    setAddressError(message);
  }

  function setDraftValue<K extends keyof AddressDraft>(key: K, value: AddressDraft[K]) {
    setAddressError(null);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function refreshAddresses() {
    setRefreshing(true);
    try {
      await addresses.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  function openNewWizard() {
    const fresh = emptyDraft();
    openedWith.current = JSON.stringify(fresh);
    setEditingId(undefined);
    setDraft(fresh);
    setAddressError(null);
    setStep(0);
    setWizardOpen(true);
  }

  function openEditWizard(address: AddressRecord) {
    const existing = {
      ...address,
      localGovernmentAreaId: (address as unknown as { localGovernmentAreaId?: string }).localGovernmentAreaId || "",
    };
    openedWith.current = JSON.stringify(existing);
    setEditingId(address.publicId);
    setDraft(existing);
    setAddressError(null);
    setStep(2);
    setWizardOpen(true);
  }

  function selectState(state: HookOperatingState) {
    setAddressError(null);
    setDraft((current) => ({
      ...current,
      stateId: state.publicId,
      stateCode: state.code,
      stateName: state.name,
      cityName: state.capitalName || state.name,
      localGovernmentAreaId: "",
      localGovernmentArea: "",
      formattedAddress: "",
    }));
    setStep(1);
  }

  function selectLocalGovernment(localGovernment: PublicLocalGovernment) {
    setAddressError(null);
    setDraft((current) => ({
      ...current,
      localGovernmentAreaId: localGovernment.publicId,
      localGovernmentArea: localGovernment.name,
      formattedAddress: "",
    }));
    setStep(2);
  }

  /** A stray tap, swipe or the Android back button must never throw away what the customer has typed, so closing asks first. */
  function requestCloseWizard() {
    if (saving) return;
    const changed = step > 0 && !editingId ? true : JSON.stringify(draft) !== openedWith.current;
    if (!changed) {
      closeWizard();
      return;
    }
    Alert.alert(
      editingId ? "Discard your changes?" : "Discard this address?",
      editingId ? "Your edits to this address will be lost." : "What you've entered so far will be lost.",
      [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: closeWizard },
      ],
    );
  }

  async function saveAddress() {
    if (saving) return;
    setAddressError(null);
    if (!draft.stateId || !draft.localGovernmentAreaId) {
      showAddressError("Choose your delivery State and Local Government Area");
      return;
    }
    if (!draft.recipientName.trim() || !draft.phone.trim() || !draft.line1.trim()) {
      showAddressError("Add the recipient name, phone number, and house address");
      return;
    }
    if (draft.line1.trim().length < 4) {
      showAddressError("Enter a complete house number and street address");
      return;
    }
    if (draft.phone.trim().replace(/[^0-9]/g, "").length < 7) {
      showAddressError("Enter a valid phone number");
      return;
    }
    const formattedAddress = [draft.line1, draft.line2, draft.landmark]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(", ");
    const payload: CustomerAddressInput = {
      label: draft.label.trim() || "Home",
      recipientName: draft.recipientName.trim(),
      phone: draft.phone.trim(),
      line1: draft.line1.trim(),
      line2: draft.line2?.trim() || undefined,
      landmark: draft.landmark?.trim() || undefined,
      stateId: draft.stateId,
      cityId: draft.cityId,
      zoneId: draft.zoneId,
      postalCode: draft.postalCode?.trim() || undefined,
      formattedAddress,
      stateCode: draft.stateCode,
      stateName: draft.stateName,
      cityName: draft.cityName,
      localGovernmentAreaId: draft.localGovernmentAreaId,
      localGovernmentArea: draft.localGovernmentArea?.trim() || undefined,
      isDefault: draft.isDefault || addressRows.length === 0,
    };
    try {
      let savedId: string | undefined;
      if (editingId) await update.mutateAsync({ id: editingId, ...payload });
      else {
        const created = (await create.mutateAsync(payload)) as { publicId?: string; data?: { publicId?: string } } | undefined;
        savedId = created?.publicId || created?.data?.publicId;
      }
      setAddressError(null);
      if (cameFromCheckout.current && savedId) addressHandoff.set(savedId);
      closeWizard();
      toast.success(editingId ? "Address updated" : "Address saved");
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not save address");
      setAddressError(message);
      toast.error(message);
    }
  }

  async function removeAddress() {
    if (!addressToRemove) return;
    try {
      await remove.mutateAsync(addressToRemove.id);
      setAddressToRemove(null);
      toast.success("Address removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not remove address"));
    }
  }

  if (addresses.isLoading && !wizardOpen) {
    return <HookPageLoading variant="list" title="Delivery addresses" label="Loading addresses" />;
  }

  return (
    <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <HookBackButton />
        <Text style={centeredHeaderTextStyle}>Delivery addresses</Text>
        <Pressable accessibilityLabel="Add delivery address" accessibilityRole="button" onPress={openNewWizard} className="h-11 w-11 items-center justify-center rounded-full bg-hook">
          <Ionicons name="add" size={23} color="#111" />
        </Pressable>
      </View>

      <ScrollView
        alwaysBounceVertical
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshAddresses()} tintColor="#111111" />}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          {addressRows.map((address) => (
            <SwipeableAddressCard
              key={address.publicId}
              address={address}
              removing={remove.isPending}
              onEdit={() => openEditWizard(address)}
              onRemove={() => setAddressToRemove({ id: address.publicId, label: address.label })}
              onMakeDefault={() =>
                void makeDefault
                  .mutateAsync(address.publicId)
                  .then(() => toast.success("Default address updated"))
                  .catch((error) => toast.error(getApiErrorMessage(error, "Could not update default address")))
              }
              onOpen={registerRowOpen}
              onClosed={registerRowClosed}
            />
          ))}
        </View>

        {!addresses.isError && !addressRows.length ? (
          <View className="overflow-hidden rounded-[24px] bg-white">
            <View className="bg-hook px-5 py-6">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-black">
                <Ionicons name="navigate-outline" size={22} color="#FFC809" />
              </View>
              <Text className="mt-5 text-[23px] font-black text-black">Delivery, made clearer</Text>
              <Text className="mt-2 text-sm leading-5 text-black/60">
                Save where orders should arrive and choose a default address for faster checkout.
              </Text>
            </View>
            <View className="items-center px-6 py-10">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FFF4C7]">
                <Ionicons name="location-outline" size={30} color="#111" />
              </View>
              <Text className="mt-4 text-lg font-black text-black">No delivery address yet</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#777]">
                Add a recipient and delivery location. You can update it whenever you need to.
              </Text>
              <Pressable onPress={openNewWizard} className="mt-6 h-12 items-center justify-center rounded-full bg-hook px-6">
                <Text className="font-black text-black">Add delivery address</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        {addresses.isError ? <View className="mt-10 items-center rounded-[22px] bg-white p-6"><Ionicons name="cloud-offline-outline" size={30} color="#777" /><Text className="mt-3 font-bold text-black">Addresses could not be refreshed</Text><Pressable onPress={() => void addresses.refetch()} className="mt-4 rounded-full bg-hook px-5 py-2.5"><Text className="font-bold text-black">Try again</Text></Pressable></View> : null}
      </ScrollView>

      {/*
        A full-screen page rather than a sheet: nothing behind it can be tapped, so there is no tap-outside or swipe-down that
        could wipe a half-filled address, and the keyboard has the whole screen to work with.
      */}
      <Modal
        visible={wizardOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={requestCloseWizard}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#F1F1F3" }}>
          <View style={{ flex: 1, paddingTop: insets.top }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 }}>
              {step > 0 ? (
                <Pressable
                  accessibilityLabel="Previous address step"
                  accessibilityRole="button"
                  onPress={() => setStep(step - 1)}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </Pressable>
              ) : <View style={{ width: 44 }} />}
              <Text accessibilityRole="header" numberOfLines={1} style={[{ flex: 1, textAlign: "center", fontSize: 18, fontFamily: "NunitoSans-Black", color: "#111" }, centeredHeaderTextStyle]}>
                {editingId ? "Edit delivery address" : "Add delivery address"}
              </Text>
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                onPress={requestCloseWizard}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="close" size={22} color="#111" />
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-wider text-black/45">Step {step + 1} of 3</Text>
                <Text className="text-xs font-semibold text-black/45">{step === 0 ? "State & capital" : step === 1 ? "Local government" : "Delivery details"}</Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-black/10"><View className="h-full rounded-full bg-hook" style={{ width: `${((step + 1) / 3) * 100}%` }} /></View>
            </View>

            {/* Keyed by step so every step opens at its top instead of wherever the last one was scrolled to. */}
            <ScrollView
              key={step}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 }}
              automaticallyAdjustKeyboardInsets
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Reveal from="bottom">
                {step === 0 ? <StateStep rows={stateRows} selectedId={draft.stateId} loading={states.isLoading} error={states.isError} onRetry={() => void states.refetch()} onSelect={selectState} /> : null}
                {step === 1 ? <LocalGovernmentStep state={selectedState} rows={localGovernmentRows} selectedId={draft.localGovernmentAreaId} loading={localGovernments.isLoading} error={localGovernments.isError} onRetry={() => void localGovernments.refetch()} onSelect={selectLocalGovernment} /> : null}
                {step === 2 ? <AddressStep draft={draft} error={addressError} onChange={setDraftValue} /> : null}
              </Reveal>
            </ScrollView>

            {step === 2 ? (
              <View style={{ borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)", backgroundColor: "#F1F1F3", paddingHorizontal: 20, paddingTop: 12, paddingBottom: keyboardUp ? 12 : Math.max(insets.bottom, 12) }}>
                <Pressable
                  accessibilityLabel="Save delivery address"
                  accessibilityRole="button"
                  accessibilityState={{ busy: saving, disabled: saving }}
                  disabled={saving}
                  onPress={() => void saveAddress()}
                  style={{ height: 56, borderRadius: 28, backgroundColor: "#FFC809", alignItems: "center", justifyContent: "center", opacity: saving ? 0.65 : 1 }}
                >
                  {saving ? (
                    <View className="flex-row items-center gap-2"><HookLoader size="button" variant="dark" /><Text className="font-black text-black">Saving address</Text></View>
                  ) : (
                    <Text className="text-base font-black text-black">Save address</Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <HookConfirmSheet
        visible={Boolean(addressToRemove)}
        title="Remove address?"
        message={addressToRemove ? `${addressToRemove.label} will no longer be available at checkout.` : ""}
        confirmLabel="Remove"
        cancelLabel="Keep address"
        destructive
        onConfirm={() => void removeAddress()}
        onClose={() => setAddressToRemove(null)}
      />
    </View>
  );
}

const SWIPE_ACTION_WIDTH = 72;
const SWIPE_OPEN_OFFSET = -(SWIPE_ACTION_WIDTH * 2);

/** Swipe-left-to-reveal address card with edit/delete in a fixed action rail. */
function SwipeableAddressCard({
  address,
  removing,
  onEdit,
  onRemove,
  onMakeDefault,
  onOpen,
  onClosed,
}: {
  address: AddressRecord;
  removing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMakeDefault: () => void;
  onOpen: (id: string, close: () => void) => void;
  onClosed: (id: string) => void;
}) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  function closeFromJs() {
    translateX.value = withSpring(0, SPRING_PANEL);
    onClosed(address.publicId);
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const next = startX.value + event.translationX;
      translateX.value = Math.min(0, Math.max(SWIPE_OPEN_OFFSET, next));
    })
    .onEnd((event) => {
      const shouldOpen = translateX.value < SWIPE_OPEN_OFFSET / 2 || event.velocityX < -600;
      if (shouldOpen) {
        translateX.value = withSpring(SWIPE_OPEN_OFFSET, SPRING_PANEL);
        runOnJS(onOpen)(address.publicId, closeFromJs);
      } else {
        translateX.value = withSpring(0, SPRING_PANEL);
        runOnJS(onClosed)(address.publicId);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  function withClose(action: () => void) {
    translateX.value = withSpring(0, SPRING_PANEL);
    onClosed(address.publicId);
    action();
  }

  return (
    <View className="overflow-hidden rounded-[22px]">
      <View className="absolute inset-y-0 right-0 flex-row">
        <Pressable
          accessibilityLabel={`Edit ${address.label} address`}
          accessibilityRole="button"
          onPress={() => withClose(onEdit)}
          style={{ width: SWIPE_ACTION_WIDTH }}
          className="items-center justify-center bg-[#eef0f2] active:bg-[#e2e5e9]"
        >
          <Ionicons name="create-outline" size={20} color="#111" />
          <Text className="mt-1 text-[11px] font-bold text-black">Edit</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Remove ${address.label} address`}
          accessibilityRole="button"
          disabled={removing}
          onPress={() => withClose(onRemove)}
          style={{ width: SWIPE_ACTION_WIDTH, opacity: removing ? 0.5 : 1 }}
          className="items-center justify-center bg-[#c53b35] active:bg-[#a83029]"
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text className="mt-1 text-[11px] font-bold text-white">Delete</Text>
        </Pressable>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle} className="bg-white p-4">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 font-black text-black" numberOfLines={1}>{address.label}</Text>
            {address.isDefault ? (
              <Text className="shrink-0 rounded-full bg-hook/20 px-2 py-1 text-[10px] font-bold text-black">Default</Text>
            ) : null}
          </View>
          <Text className="mt-2 text-sm text-[#444]">{address.formattedAddress || address.line1}</Text>
          <Text className="mt-1 text-xs text-[#888]">{[address.localGovernmentArea, address.cityName, address.stateName].filter(Boolean).join(" · ")}</Text>
          <Text className="mt-1 text-xs text-[#888]">{address.recipientName} · {address.phone}</Text>
          <View className="mt-4 flex-row items-center justify-between">
            {!address.isDefault ? (
              <Pressable accessibilityRole="button" onPress={onMakeDefault} className="self-start rounded-full bg-[#FFF4C7] px-3 py-2">
                <Text className="text-xs font-bold text-[#665000]">Make default</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <View className="flex-row items-center gap-1">
              <Ionicons name="chevron-back" size={14} color="#bbb" />
              <Text className="text-[11px] font-medium text-[#bbb]">Swipe for options</Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function StateStep({
  rows,
  selectedId,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  rows: HookOperatingState[];
  selectedId?: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (state: HookOperatingState) => void;
}) {
  return (
    <View>
      <Text className="text-2xl font-black text-black">Choose your State</Text>
      <Text className="mt-2 text-sm leading-5 text-black/55">Select where you want your order delivered. Hook delivery coverage is separate from Market availability.</Text>
      {loading ? <HookLoader label="Loading delivery states" className="mt-8" /> : null}
      {error ? <RetryLocation onRetry={onRetry} message="States could not be loaded" /> : null}
      {!loading && !error && !rows.length ? <EmptyLocation message="No delivery-enabled states found" /> : null}
      <View className="mt-5 gap-2">
        {rows.map((state) => {
          const selected = state.publicId === selectedId;
          return (
            <Pressable key={state.publicId} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => onSelect(state)} className={`flex-row items-center justify-between rounded-2xl border px-4 py-4 ${selected ? "border-black bg-hook" : "border-black/10 bg-white"}`}>
              <View className="flex-1 pr-4">
                <Text className="font-bold text-black">{state.name}</Text>
                <Text className="mt-1 text-xs text-black/50">Capital: {state.capitalName || "Not specified"} · {state.code}</Text>
              </View>
              <Ionicons name={selected ? "checkmark-circle" : "chevron-forward"} size={22} color="#111" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LocalGovernmentStep({
  state,
  rows,
  selectedId,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  state?: HookOperatingState;
  rows: PublicLocalGovernment[];
  selectedId?: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (localGovernment: PublicLocalGovernment) => void;
}) {
  return (
    <View>
      <Text className="text-2xl font-black text-black">Choose your Local Government</Text>
      <Text className="mt-2 text-sm leading-5 text-black/55">Choose the LGA for the delivery address. Hook manages this list so it stays consistent at checkout.</Text>
      {state ? (
        <View className="mt-5 flex-row items-center rounded-2xl border border-black/10 bg-[#fff9df] px-4 py-3">
          <Ionicons name="location" size={20} color="#111" />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-black text-black">{state.name}</Text>
            <Text className="mt-1 text-xs text-black/55">Capital: {state.capitalName || "Not specified"}</Text>
          </View>
        </View>
      ) : null}
      {loading ? <HookLoader label="Loading local governments" className="mt-8" /> : null}
      {error ? <RetryLocation onRetry={onRetry} message="Local governments could not be loaded" /> : null}
      {!loading && !error && !rows.length ? <EmptyLocation message="No active local governments found for this State" /> : null}
      <View className="mt-5 gap-2">
        {rows.map((localGovernment) => {
          const selected = localGovernment.publicId === selectedId;
          return (
            <Pressable key={localGovernment.publicId} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => onSelect(localGovernment)} className={`flex-row items-center justify-between rounded-2xl border px-4 py-4 ${selected ? "border-black bg-hook" : "border-black/10 bg-white"}`}>
              <Text className="flex-1 pr-4 font-bold text-black">{localGovernment.name}</Text>
              <Ionicons name={selected ? "checkmark-circle" : "chevron-forward"} size={22} color="#111" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RetryLocation({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <View className="mt-8 items-center rounded-2xl bg-white p-6">
      <Ionicons name="cloud-offline-outline" size={28} color="#777" />
      <Text className="mt-3 font-bold text-black">{message}</Text>
      <Pressable onPress={onRetry} className="mt-4 rounded-full bg-hook px-5 py-2.5">
        <Text className="font-bold text-black">Try again</Text>
      </Pressable>
    </View>
  );
}

function EmptyLocation({ message }: { message: string }) {
  return (
    <View className="mt-8 items-center rounded-2xl bg-white p-6">
      <Ionicons name="alert-circle-outline" size={28} color="#777" />
      <Text className="mt-3 text-center text-sm text-black/60">{message}</Text>
    </View>
  );
}

/** Labeled input field with an optional character counter that turns red at the save limit. */
function LabeledField({
  label,
  optional,
  limit,
  value,
  children,
}: {
  label: string;
  optional?: boolean;
  limit?: number;
  value: string;
  children: React.ReactNode;
}) {
  const overLimit = Boolean(limit && value.length > limit);
  const nearLimit = Boolean(limit && !overLimit && value.length >= limit - 10);
  return (
    <View>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="ml-1 text-[13px] font-bold text-[#46464A]">
          {label}
          {optional ? <Text className="font-medium text-black/35"> · optional</Text> : null}
        </Text>
        {limit ? (
          <Text className={`text-[11px] font-semibold ${overLimit ? "text-[#C53B35]" : nearLimit ? "text-[#A15C00]" : "text-black/30"}`}>
            {value.length}/{limit}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function AddressStep({
  draft,
  error,
  onChange,
}: {
  draft: AddressDraft;
  error?: string | null;
  onChange: <K extends keyof AddressDraft>(
    key: K,
    value: AddressDraft[K],
  ) => void;
}) {
  return (
    <View>
      <Text className="text-2xl font-black text-black">Add delivery details</Text>
      <Text className="mt-2 text-sm leading-5 text-black/55">
        Tell us where to deliver and who should receive the order. Your State,
        capital, and LGA are already selected.
      </Text>

      {error ? (
        <View
          accessibilityRole="alert"
          className="mt-4 flex-row items-start rounded-2xl border border-[#D84A3A]/20 bg-[#FFF0ED] px-4 py-3"
        >
          <Ionicons name="alert-circle" size={20} color="#C53B35" />
          <View className="ml-3 flex-1">
            <Text className="font-black text-[#A52E28]">Address not accepted</Text>
            <Text className="mt-1 text-sm leading-5 text-[#A52E28]">{error}</Text>
          </View>
        </View>
      ) : null}

      <View className="mt-5 flex-row items-center rounded-[22px] bg-[#FFF4C7] p-4">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Ionicons name="location" size={18} color="#8A6900" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-[#6F5600]">Delivery area</Text>
          <Text className="mt-0.5 font-black text-black">{draft.localGovernmentArea}, {draft.cityName}</Text>
          <Text className="text-sm text-black/55">{draft.stateName}</Text>
        </View>
      </View>

      <FormSection icon="person-outline" title="Who's receiving this">
        <LabeledField label="Recipient name" limit={FIELD_LIMITS.recipientName} value={draft.recipientName}>
          <ClearableInput
            className={inputClass}
            placeholder="Full name of who receives it"
            placeholderTextColor="#999"
            value={draft.recipientName}
            onChangeText={(value) => onChange("recipientName", value)}
            autoCapitalize="words"
            maxLength={FIELD_LIMITS.recipientName}
          />
        </LabeledField>

        <LabeledField label="Phone number" value={draft.phone}>
          <ClearableInput
            className={inputClass}
            placeholder="080 000 0000"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={draft.phone}
            onChangeText={(value) => onChange("phone", value)}
            maxLength={24}
          />
        </LabeledField>
      </FormSection>

      <FormSection icon="location-outline" title="Address details">
        <LabeledField label="Address label" limit={FIELD_LIMITS.label} value={draft.label}>
          <ClearableInput
            className={inputClass}
            placeholder="e.g. Home, Office"
            placeholderTextColor="#999"
            value={draft.label}
            onChangeText={(value) => onChange("label", value)}
            maxLength={FIELD_LIMITS.label}
          />
        </LabeledField>

        <LabeledField label="House number and street" limit={FIELD_LIMITS.line1} value={draft.line1}>
          <TextInput
            className={textAreaClass}
            placeholder="e.g. 14 Adeola Odeku Street"
            placeholderTextColor="#999"
            value={draft.line1}
            onChangeText={(value) => onChange("line1", value)}
            multiline
            textAlignVertical="top"
            maxLength={FIELD_LIMITS.line1}
          />
        </LabeledField>

        <LabeledField label="Apartment, floor or suite" optional limit={FIELD_LIMITS.line2} value={draft.line2 || ""}>
          <ClearableInput
            className={inputClass}
            placeholder="e.g. Flat 3B"
            placeholderTextColor="#999"
            value={draft.line2 || ""}
            onChangeText={(value) => onChange("line2", value)}
            maxLength={FIELD_LIMITS.line2}
          />
        </LabeledField>

        <LabeledField label="Nearest landmark" optional limit={FIELD_LIMITS.landmark} value={draft.landmark || ""}>
          <TextInput
            className={inputClass}
            placeholder="e.g. Opposite First Bank"
            placeholderTextColor="#999"
            value={draft.landmark || ""}
            onChangeText={(value) => onChange("landmark", value)}
            maxLength={FIELD_LIMITS.landmark}
          />
        </LabeledField>

        <LabeledField label="Postcode" optional limit={FIELD_LIMITS.postalCode} value={draft.postalCode || ""}>
          <TextInput
            className={inputClass}
            placeholder="Optional"
            placeholderTextColor="#999"
            value={draft.postalCode || ""}
            onChangeText={(value) => onChange("postalCode", value)}
            keyboardType="numeric"
            maxLength={FIELD_LIMITS.postalCode}
          />
        </LabeledField>
      </FormSection>
    </View>
  );
}

/** One clearly labeled group of fields, so a long form reads as a couple of scannable sections instead of one list. */
function FormSection({ icon, title, children }: { icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; children: React.ReactNode }) {
  return (
    <View className="mt-4 rounded-[22px] bg-white p-4">
      <View className="mb-4 flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-[#FFF4C7]">
          <Ionicons name={icon} size={14} color="#8A6900" />
        </View>
        <Text className="text-sm font-black text-black">{title}</Text>
      </View>
      <View className="gap-4">{children}</View>
    </View>
  );
}
