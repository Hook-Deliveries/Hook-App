import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Modal as NativeModal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

type BottomSheetModalProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  dismissible?: boolean;
  accessibilityLabel?: string;
}>;

const enterTransition = SlideInDown.springify()
  .damping(22)
  .stiffness(240)
  .mass(0.85);

const exitTransition = SlideOutDown.springify()
  .damping(24)
  .stiffness(280)
  .mass(0.8);

export function BottomSheetModal({
  visible,
  onClose,
  title,
  dismissible = true,
  accessibilityLabel,
  children,
}: BottomSheetModalProps) {
  function handleClose() {
    if (dismissible) onClose();
  }

  return (
    <NativeModal
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50">
        <Pressable
          accessibilityLabel="Close modal"
          accessibilityRole="button"
          className="flex-1"
          disabled={!dismissible}
          onPress={handleClose}
        />

        <Animated.View
          accessibilityLabel={accessibilityLabel ?? title}
          accessibilityViewIsModal
          className="max-h-[90%] rounded-t-[28px] bg-white px-6 pb-8 pt-3"
          entering={enterTransition}
          exiting={exitTransition}>
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-black/10" />

          <View className={title ? 'mb-6 min-h-9 justify-center' : 'mb-2 min-h-9 justify-center'}>
            {title ? (
              <Text className="px-10 text-center text-xl font-bold text-black" numberOfLines={1}>
                {title}
              </Text>
            ) : null}

            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              className="absolute right-0 h-9 w-9 items-center justify-center rounded-full bg-hook-surface"
              disabled={!dismissible}
              hitSlop={8}
              onPress={handleClose}>
              <Ionicons name="close" size={20} color="#111111" />
            </Pressable>
          </View>

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </NativeModal>
  );
}

