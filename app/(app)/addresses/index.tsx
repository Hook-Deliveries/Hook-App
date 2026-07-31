import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "@/components/shared/BottomSheetModal";
import { HookLoader } from "@/components/shared/HookLoader";
import { toast } from "@/components/shared/toast";
import {
  useAddressesQuery,
  useCreateAddressMutation,
  useDefaultAddressMutation,
  useDeleteAddressMutation,
  useOperatingStatesQuery,
  useOperationCitiesQuery,
  useServiceZonesQuery,
} from "@/lib/mobile-api";

const inputClass =
  "h-12 rounded-2xl border border-black/10 bg-[#fafafa] px-4 text-sm";
export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const addresses = useAddressesQuery();
  const create = useCreateAddressMutation();
  const remove = useDeleteAddressMutation();
  const makeDefault = useDefaultAddressMutation();
  const states = useOperatingStatesQuery();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: "Home",
    recipientName: "",
    phone: "",
    line1: "",
    landmark: "",
    stateId: "",
    cityId: "",
    zoneId: "",
  });
  const cities = useOperationCitiesQuery(form.stateId);
  const zones = useServiceZonesQuery(form.stateId, form.cityId);
  const stateRows = useMemo(
    () => (states.data as any)?.data || states.data || [],
    [states.data],
  );
  async function submit() {
    if (
      !form.recipientName ||
      !form.phone ||
      !form.line1 ||
      !form.stateId ||
      !form.cityId ||
      !form.zoneId
    )
      return toast.error("Complete all required address fields");
    try {
      await create.mutateAsync({ ...form, isDefault: !addresses.data?.length });
      setOpen(false);
      toast.success("Address saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save address",
      );
    }
  }
  if (addresses.isLoading)
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f4f5]">
        <HookLoader label="Loading addresses" />
      </View>
    );
  return (
    <View className="flex-1 bg-[#f4f4f5]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="arrow-back" size={21} />
        </Pressable>
        <Text className="text-xl font-black">Delivery addresses</Text>
        <Pressable
          onPress={() => setOpen(true)}
          className="h-11 w-11 items-center justify-center rounded-full bg-hook"
        >
          <Ionicons name="add" size={23} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="gap-3">
          {addresses.data?.map((address) => (
            <View
              key={address.publicId}
              className="rounded-[22px] bg-white p-4"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-black">{address.label}</Text>
                    {address.isDefault ? (
                      <Text className="rounded-full bg-hook/20 px-2 py-1 text-[10px] font-bold">
                        Default
                      </Text>
                    ) : null}
                  </View>
                  <Text className="mt-2 text-sm text-[#555]">
                    {address.line1}
                  </Text>
                  <Text className="mt-1 text-xs text-[#888]">
                    {address.recipientName} · {address.phone}
                  </Text>
                </View>
                <Pressable
                  onPress={async () => {
                    try {
                      await remove.mutateAsync(address.publicId);
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Could not remove address",
                      );
                    }
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#d44" />
                </Pressable>
              </View>
              {!address.isDefault ? (
                <Pressable
                  onPress={() => makeDefault.mutate(address.publicId)}
                  className="mt-4 self-start"
                >
                  <Text className="text-xs font-bold text-[#876500]">
                    Make default
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
        {!addresses.data?.length ? (
          <View className="mt-24 items-center">
            <Ionicons name="location-outline" size={42} color="#aaa" />
            <Text className="mt-4 text-lg font-black">
              No delivery address yet
            </Text>
            <Text className="mt-2 text-center text-sm text-[#777]">
              Add an address in an active Hook service zone.
            </Text>
          </View>
        ) : null}
      </ScrollView>
      <BottomSheetModal
        visible={open}
        onClose={() => setOpen(false)}
        title="Add delivery address"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="max-h-[620px]"
        >
          <View className="gap-3">
            <TextInput
              className={inputClass}
              placeholder="Label, e.g. Home"
              value={form.label}
              onChangeText={(label) => setForm({ ...form, label })}
            />
            <TextInput
              className={inputClass}
              placeholder="Recipient name"
              value={form.recipientName}
              onChangeText={(recipientName) =>
                setForm({ ...form, recipientName })
              }
            />
            <TextInput
              className={inputClass}
              placeholder="Phone"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(phone) => setForm({ ...form, phone })}
            />
            <TextInput
              className={inputClass}
              placeholder="Street address"
              value={form.line1}
              onChangeText={(line1) => setForm({ ...form, line1 })}
            />
            <TextInput
              className={inputClass}
              placeholder="Landmark (optional)"
              value={form.landmark}
              onChangeText={(landmark) => setForm({ ...form, landmark })}
            />
            <Choice
              title="State"
              rows={stateRows}
              value={form.stateId}
              onSelect={(stateId) =>
                setForm({ ...form, stateId, cityId: "", zoneId: "" })
              }
            />
            <Choice
              title="City"
              rows={(cities.data as any)?.data || cities.data || []}
              value={form.cityId}
              onSelect={(cityId) => setForm({ ...form, cityId, zoneId: "" })}
            />
            <Choice
              title="Service zone"
              rows={(zones.data as any)?.data || zones.data || []}
              value={form.zoneId}
              onSelect={(zoneId) => setForm({ ...form, zoneId })}
            />
            <Pressable
              disabled={create.isPending}
              onPress={() => void submit()}
              className="mt-2 h-14 items-center justify-center rounded-2xl bg-hook"
            >
              {create.isPending ? (
                <HookLoader size="button" />
              ) : (
                <Text className="font-black">Save address</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </BottomSheetModal>
    </View>
  );
}
function Choice({
  title,
  rows,
  value,
  onSelect,
}: {
  title: string;
  rows: any[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View>
      <Text className="mb-2 text-xs font-bold text-[#666]">{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {rows.map((row) => (
          <Pressable
            key={row.publicId || row.id}
            onPress={() => onSelect(row.publicId || row.id)}
            className={`rounded-full border px-4 py-2.5 ${value === (row.publicId || row.id) ? "border-black bg-black" : "border-black/10 bg-white"}`}
          >
            <Text
              className={`text-xs font-bold ${value === (row.publicId || row.id) ? "text-white" : ""}`}
            >
              {row.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
