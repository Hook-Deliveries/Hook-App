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

const accentColor: Record<ToastVariant, string> = {
  info: '#FFC809',
  success: '#4ade80',
  error: '#f87171',
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
  }, []);

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
      <View className="flex-row items-center gap-3 rounded-full bg-[#1a1a1a] px-5 py-3.5 shadow-lg">
        {/* Accent dot */}
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accentColor[variant] }}
        />
        <Text className="flex-1 text-sm font-medium text-white">{config.message}</Text>
        {config.subtitle ? (
          <Text className="text-[13px] text-white/40">{config.subtitle}</Text>
        ) : null}
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
