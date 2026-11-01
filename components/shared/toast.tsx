import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/lib/haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPRING_PANEL } from '@/constants/motion';

// ─── Types ──────────────────────────────────────────────────────────────────

type ToastVariant = 'info' | 'success' | 'error';

interface ToastConfig {
  message: string;
  subtitle?: string;
  variant?: ToastVariant;
  duration?: number;
  /** A small secondary action shown inside the capsule, e.g. Undo or View. */
  action?: { label: string; onPress: () => void };
}

interface ToastState extends ToastConfig {
  id: number;
}

// ─── Singleton emitter ───────────────────────────────────────────────────────
// Lets any component call toast.show() without prop-drilling.

type Listener = (config: ToastState) => void;
const listeners = new Set<Listener>();
let nextId = 0;

export const toast = {
  show(config: ToastConfig) {
    const state: ToastState = { ...config, id: ++nextId };
    // Confirm outcomes by feel as well as by sight.
    if (config.variant === 'success') haptics.success();
    else if (config.variant === 'error') haptics.error();
    listeners.forEach((l) => l(state));
  },
  info(message: string, subtitle?: string) {
    toast.show({ message, subtitle, variant: 'info' });
  },
  success(message: string, subtitle?: string) {
    toast.show({ message, subtitle, variant: 'success' });
  },
  error(message: string, subtitle?: string) {
    toast.show({ message, subtitle, variant: 'error' });
  },
};

// ─── Status circle per variant ───────────────────────────────────────────────
// Mirrors the capsule design: a softly tinted circle with a vivid icon on the dark body.

const toastStyle: Record<ToastVariant, { icon: keyof typeof Ionicons.glyphMap; tint: string; ink: string }> = {
  info: { icon: 'information', tint: 'rgba(255,200,9,0.18)', ink: '#FFC809' },
  success: { icon: 'checkmark', tint: 'rgba(18,183,106,0.2)', ink: '#2FD68B' },
  error: { icon: 'alert', tint: 'rgba(239,68,68,0.22)', ink: '#FF6B6B' },
};

// ─── Single toast pill ───────────────────────────────────────────────────────

function ToastPill({
  config,
  onDone,
}: {
  config: ToastState;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-36)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  const { variant = 'info', duration = config.action ? 5200 : 3000 } = config;
  const style = toastStyle[variant];

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const dismiss = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const targetX =
        direction === 'left' ? -420 : direction === 'right' ? 420 : 0;
      const targetY = direction === 'up' ? -(insets.top + 120) : -24;

      Animated.parallel([
        Animated.timing(translateX, {
          duration: 190,
          toValue: targetX,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 190,
          toValue: targetY,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 170,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start(() => onDoneRef.current());
    },
    [insets.top, opacity, translateX, translateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 || gesture.dy < -8,
        onPanResponderGrant: () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        },
        onPanResponderMove: (_, gesture) => {
          const isHorizontal = Math.abs(gesture.dx) >= Math.abs(gesture.dy);
          const nextX = isHorizontal ? gesture.dx : gesture.dx * 0.28;
          const nextY = isHorizontal ? Math.min(0, gesture.dy * 0.25) : Math.min(0, gesture.dy);
          const progress = Math.max(
            Math.abs(nextX) / 180,
            Math.max(0, -nextY) / 110,
          );

          translateX.setValue(nextX);
          translateY.setValue(nextY);
          opacity.setValue(1 - Math.min(progress * 0.7, 0.7));
        },
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) > 80) {
            dismiss(gesture.dx < 0 ? 'left' : 'right');
            return;
          }
          if (gesture.dy < -52) {
            dismiss('up');
            return;
          }

          Animated.parallel([
            Animated.spring(translateX, {
              damping: SPRING_PANEL.damping,
              stiffness: SPRING_PANEL.stiffness,
              mass: SPRING_PANEL.mass,
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              damping: SPRING_PANEL.damping,
              stiffness: SPRING_PANEL.stiffness,
              mass: SPRING_PANEL.mass,
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              duration: 120,
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();

          timerRef.current = setTimeout(() => dismiss('up'), duration);
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.spring(translateX, {
              damping: SPRING_PANEL.damping,
              stiffness: SPRING_PANEL.stiffness,
              mass: SPRING_PANEL.mass,
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              damping: SPRING_PANEL.damping,
              stiffness: SPRING_PANEL.stiffness,
              mass: SPRING_PANEL.mass,
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              duration: 120,
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
          timerRef.current = setTimeout(() => dismiss('up'), duration);
        },
      }),
    [dismiss, duration, opacity, translateX, translateY],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        damping: SPRING_PANEL.damping,
        stiffness: SPRING_PANEL.stiffness,
        mass: SPRING_PANEL.mass,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        duration: 160,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => dismiss('up'), duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [dismiss, duration, opacity, translateY]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      accessibilityRole="alert"
      accessibilityHint="Swipe left or right, or pull upward to dismiss"
      style={{
        left: 14,
        opacity,
        position: 'absolute',
        right: 14,
        top: insets.top + 8,
        transform: [{ translateX }, { translateY }],
        zIndex: 9999,
      }}>
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <View
          className="min-h-[44px] flex-1 flex-row items-center"
          style={{
            backgroundColor: '#14141A',
            borderRadius: 22,
            paddingVertical: 6,
            paddingLeft: 6,
            paddingRight: 10,
            gap: 10,
            shadowColor: '#0B0B10',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 12,
            elevation: 10,
          }}>
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: style.tint }}>
            <Ionicons name={style.icon} size={17} color={style.ink} />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="text-left text-[13px] font-bold leading-[18px] text-white"
              ellipsizeMode="tail"
              numberOfLines={2}>
              {config.message}
            </Text>
            {config.subtitle ? (
              <Text
                className="text-left text-[11px] leading-[15px]"
                style={{ color: 'rgba(255,255,255,0.62)' }}
                ellipsizeMode="tail"
                numberOfLines={2}>
                {config.subtitle}
              </Text>
            ) : null}
          </View>
          {config.action ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={config.action.label}
              hitSlop={6}
              onPress={() => {
                config.action?.onPress();
                dismiss('up');
              }}
              style={{ backgroundColor: '#232631', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
              <Text className="text-[12px] font-bold" style={{ color: '#FFC809' }}>
                {config.action.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          hitSlop={8}
          onPress={() => dismiss('up')}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            shadowColor: '#0B0B10',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.16,
            shadowRadius: 14,
            elevation: 8,
          }}>
          <Ionicons name="close" size={20} color="#3A3F4C" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── ToastProvider ───────────────────────────────────────────────────────────
// Mount once at the root (inside your layout). All toasts render here.

export function ToastProvider() {
  const [current, setCurrent] = useState<ToastState | null>(null);

  useEffect(() => {
    function handle(state: ToastState) {
      setCurrent(state);
    }
    listeners.add(handle);
    return () => {
      listeners.delete(handle);
    };
  }, []);

  if (!current) return null;

  return (
    <ToastPill
      key={current.id}
      config={current}
      onDone={() => setCurrent(null)}
    />
  );
}
