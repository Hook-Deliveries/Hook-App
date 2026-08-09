import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HookLoader } from "./HookLoader";
import { ScallopedEdge } from "../marketplace/ScallopedEdge";

type HookConfirmSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

const enterTransition = SlideInDown.springify()
  .damping(24)
  .stiffness(260)
  .mass(0.82);

const exitTransition = SlideOutDown.springify()
  .damping(26)
  .stiffness(300)
  .mass(0.86);

export function HookConfirmSheet({
  visible,
  title,
  message,
  icon = "help-circle-outline",
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: HookConfirmSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="none"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/45"
      >
        <Pressable
          accessibilityLabel="Close confirmation"
          accessibilityRole="button"
          className="absolute inset-0"
          disabled={busy}
          onPress={onClose}
        />
        <Animated.View
          accessibilityViewIsModal
          className="relative mt-auto min-h-[45vh] w-full rounded-t-[28px] bg-[#F1F1F3] px-5 pt-14"
          entering={enterTransition}
          exiting={exitTransition}
          style={{
            paddingBottom: Math.max(insets.bottom, 20),
            overflow: "visible",
          }}
        >
          <ScallopedEdge color="#F1F1F3" count={16} edge="top" size={26} />

          <View
            className="absolute -top-12 left-1/2 z-50 h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm"
            style={{ elevation: 12 }}
          >
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#FFF1B8]">
              <Ionicons name={icon} size={27} color="#111" />
            </View>
          </View>

          <Text className="text-center text-xl font-black text-[#111]">
            {title}
          </Text>
          <Text className="mt-3 text-center text-[14px] leading-6 text-[#666]">
            {message}
          </Text>

          <View className="mt-6 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onClose}
              className="h-[52px] flex-1 items-center justify-center rounded-2xl bg-white"
            >
              <Text className="font-bold text-[#111]">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void onConfirm()}
              className={`h-[52px] flex-1 items-center justify-center rounded-2xl ${destructive ? "bg-[#D94A43]" : "bg-hook"}`}
              style={{ opacity: busy ? 0.7 : 1 }}
            >
              {busy ? (
                <HookLoader size="button" variant={destructive ? "yellow" : "dark"} />
              ) : (
                <Text className={`font-black ${destructive ? "text-white" : "text-black"}`}>
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
