import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ──────────────────────────────────────────────────────────────────

type ToastVariant = 'info' | 'success' | 'error';

interface ToastConfig {
  message: string;
  subtitle?: string;
  variant?: ToastVariant;
  duration?: number;
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

// ─── Accent dot colour per variant ──────────────────────────────────────────

const toastStyle: Record<ToastVariant, { accent: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }> = {
  info: {
    accent: '#FFC809',
    icon: 'sparkles-outline',
    iconColor: '#111111',
  },
  success: {
    accent: '#12b981',
    icon: 'checkmark-circle-outline',
    iconColor: '#047857',
  },
  error: {
    accent: '#ff3b30',
    icon: 'alert-circle-outline',
    iconColor: '#dc2626',
  },
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
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { variant = 'info', duration = 2600 } = config;
  const style = toastStyle[variant];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        damping: 20,
        stiffness: 220,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        duration: 160,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          duration: 200,
          toValue: -80,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 200,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start(onDone);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDone, opacity, translateY]);

  return (
    <Animated.View
      style={{
        left: 16,
        opacity,
        position: 'absolute',
        right: 16,
        top: insets.top + 12,
        transform: [{ translateY }],
        zIndex: 9999,
      }}>
      <View className="overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-lg">
        <View
          className="absolute bottom-0 left-0 top-0 w-1"
          style={{ backgroundColor: style.accent }}
        />
        <View className="flex-row items-center gap-3 px-4 py-3">
          <View
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: variant === 'info' ? '#fff4c7' : `${style.accent}18` }}>
            <Ionicons name={style.icon} size={18} color={style.iconColor} />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="text-left text-[14px] font-semibold text-black"
              ellipsizeMode="tail"
              numberOfLines={1}>
              {config.message}
            </Text>
            {config.subtitle ? (
              <Text
                className="mt-0.5 text-left text-[12px] leading-4 text-hook-text"
                ellipsizeMode="tail"
                numberOfLines={1}>
                {config.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
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
