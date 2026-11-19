import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { HookSheet } from "./HookSheet";

type HookConfirmSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  /**
   * When set, the sheet uses a centered layout: an icon badge, a centered title and message,
   * and (optionally) a small detail chip such as the signed-in account.
   * Omit it to keep the standard left-aligned confirm sheet.
   */
  icon?: keyof typeof Ionicons.glyphMap;
  detail?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function HookConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  icon,
  detail,
  onConfirm,
  onClose,
}: HookConfirmSheetProps) {
  const actions = (
    <View className="flex-row gap-3">
      <Button title={cancelLabel} variant="secondary" disabled={busy} onPress={onClose} className="flex-1" />
      <Button title={confirmLabel} variant={destructive ? "danger" : "primary"} loading={busy} onPress={() => void onConfirm()} className="flex-1" />
    </View>
  );

  if (!icon) {
    return (
      <HookSheet
        visible={visible}
        onClose={onClose}
        busy={busy}
        maxHeight="70%"
        accessibilityLabel={title}
        title={title}
        message={message}
      >
        {actions}
      </HookSheet>
    );
  }

  const tone = destructive
    ? { badge: "#FDECEA", ring: "#F8D3CF", icon: "#D94A43" }
    : { badge: "#FFF3C4", ring: "#FBE48A", icon: "#111111" };

  return (
    <HookSheet visible={visible} onClose={onClose} busy={busy} maxHeight="70%" accessibilityLabel={title}>
      <View style={{ alignItems: "center", paddingTop: 4 }}>
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tone.badge,
            borderWidth: 6,
            borderColor: tone.ring,
          }}
        >
          <Ionicons name={icon} size={26} color={tone.icon} />
        </View>

        <Text accessibilityRole="header" style={{ marginTop: 16, textAlign: "center", fontSize: 21, fontFamily: "NunitoSans-Black", color: "#111" }}>
          {title}
        </Text>
        <Text style={{ marginTop: 8, textAlign: "center", fontSize: 14, lineHeight: 21, color: "#6B6B6E", paddingHorizontal: 8 }}>
          {message}
        </Text>

        {detail ? (
          <View
            style={{
              marginTop: 16,
              maxWidth: "100%",
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 999,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 14,
              paddingVertical: 8,
              gap: 8,
            }}
          >
            <Ionicons name="person-circle-outline" size={18} color="#6B6B6E" />
            <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 13, color: "#333" }}>{detail}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: 24 }}>{actions}</View>
    </HookSheet>
  );
}
