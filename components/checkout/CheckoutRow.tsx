import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { HookLoader } from "@/components/shared/HookLoader";

/** The picker pill used on checkout: empty shows a placeholder and chevron, filled shows the value and a "Change" chip. */
export function CheckoutRow({
  placeholder,
  value,
  onPress,
  disabled,
  loading = false,
  readOnly = false,
  detail,
}: {
  placeholder: string;
  value?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Shows a fixed value: no press, no Change button. */
  readOnly?: boolean;
  /** A smaller second line under the value, such as how long delivery takes. */
  detail?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={loading ? "Loading delivery options" : value ? `${placeholder}: ${value}` : placeholder}
      disabled={disabled || readOnly}
      accessibilityState={{ disabled: Boolean(disabled), busy: loading }}
      onPress={onPress}
      style={{ minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 18, backgroundColor: "white", paddingHorizontal: 16, paddingVertical: 12, gap: 12, opacity: disabled ? 0.6 : 1 }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, lineHeight: 21, color: "#111" }}>
          {loading ? value ? `${value} · Updating…` : "Loading delivery options…" : value || placeholder}
        </Text>
        {detail && value && !loading ? <Text style={{ marginTop: 2, fontSize: 12, lineHeight: 17, color: "#6B6B6B" }}>{detail}</Text> : null}
      </View>
      {loading ? <HookLoader size="button" /> : value && !readOnly ? (
        <View style={{ borderRadius: 8, backgroundColor: "#FFDD66", padding: 8 }}>
          <Text className="text-xs text-[#3a3a3a]">Change</Text>
        </View>
      ) : (
        <Ionicons name="chevron-down" size={18} color="#3a3a3a" />
      )}
    </Pressable>
  );
}
