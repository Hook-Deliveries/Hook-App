import type { PropsWithChildren, ReactNode } from "react";
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

import { ScallopedEdge } from "../marketplace/ScallopedEdge";

/**
 * Canonical bottom sheet chrome for the app's "badge" style — scalloped top
 * edge with a floating circular icon/image badge centered on the seam.
 * Shared by every sheet that opens with a single representative icon or
 * image (market picker, confirmations) so sizing and centering only need
 * to be right in one place.
 */

const BADGE_SIZE = 88;
const BADGE_OVERHANG = BADGE_SIZE / 2;

const enterTransition = SlideInDown.springify()
  .damping(24)
  .stiffness(260)
  .mass(0.82);

const exitTransition = SlideOutDown.springify()
  .damping(26)
  .stiffness(300)
  .mass(0.86);

type HookSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  dismissible?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  /** Rendered centered inside the floating badge, e.g. an Ionicon or an Image. */
  badge?: ReactNode;
  title?: string;
  message?: string;
  height?: number | `${number}%`;
  maxHeight?: number | `${number}%`;
  minHeight?: number | `${number}%`;
  contentClassName?: string;
}>;

export function HookSheet({
  visible,
  onClose,
  dismissible = true,
  busy = false,
  accessibilityLabel,
  badge,
  title,
  message,
  height,
  maxHeight = "80%",
  minHeight = "54%",
  contentClassName,
  children,
}: HookSheetProps) {
  const insets = useSafeAreaInsets();
  const canDismiss = dismissible && !busy;

  function handleClose() {
    if (canDismiss) onClose();
  }

  return (
    <Modal
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
        className="flex-1 bg-black/45"
      >
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          className="absolute inset-0"
          disabled={!canDismiss}
          onPress={handleClose}
        />
        <Animated.View
          accessibilityLabel={accessibilityLabel ?? title}
          accessibilityViewIsModal
          className="relative w-full self-end rounded-t-[28px] bg-[#F1F1F3] px-5"
          entering={enterTransition}
          exiting={exitTransition}
          style={{
            marginTop: "auto",
            paddingTop: badge ? BADGE_OVERHANG + 24 : 24,
            ...(height ? { height } : { minHeight }),
            maxHeight,
            paddingBottom: Math.max(insets.bottom, 20),
            overflow: "visible",
          }}
        >
          <ScallopedEdge color="#F1F1F3" count={16} edge="top" size={26} />

          {badge ? (
            <View
              className="absolute left-1/2 items-center justify-center rounded-full bg-white shadow-sm"
              style={{
                top: -BADGE_OVERHANG,
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                marginLeft: -BADGE_OVERHANG,
                zIndex: 50,
                elevation: 12,
              }}
            >
              {badge}
            </View>
          ) : null}

          {title ? (
            <Text className="text-center text-xl font-black text-[#111]">{title}</Text>
          ) : null}
          {message ? (
            <Text className="mt-3 text-center text-[14px] leading-6 text-[#666]">{message}</Text>
          ) : null}

          <View className={contentClassName ?? (title || message ? "mt-6" : "mt-0")}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
