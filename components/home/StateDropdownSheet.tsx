import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Pressable, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/shared/BottomSheetModal';
import { LottieLoader } from '@/components/shared/LottieLoader';
import { useOperatingStatesQuery } from '@/lib/mobile-api';

export interface OperatingState {
  code: string;
  name: string;
}

// Sentinel used everywhere in the app to mean "no state filter" — matches nothing
// stored in the backend, so it can never collide with a real state code.
export const ALL_STATES: OperatingState = { code: 'ALL', name: 'All States' };

interface StateDropdownSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedCode: string;
  onSelect: (state: OperatingState) => void;
}

function StateRow({
  state,
  icon,
  isSelected,
  index,
  onPress,
}: {
  state: OperatingState;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  index: number;
  onPress: () => void;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 260, delay: index * 35 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        className="flex-row items-center justify-between rounded-2xl px-4 py-3.5 active:bg-hook-surface"
        onPress={onPress}>
        <View className="flex-row items-center gap-3">
          <View
            className={`h-9 w-9 items-center justify-center rounded-full ${
              isSelected ? 'bg-hook' : 'bg-hook-surface'
            }`}>
            <Ionicons name={icon} size={17} color={isSelected ? '#ffffff' : '#9A9A9A'} />
          </View>
          <Text className={`text-base ${isSelected ? 'font-bold text-black' : 'font-medium text-hook-text'}`}>
            {state.name}
          </Text>
        </View>
        {isSelected ? (
          <MotiView
            from={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 260 }}>
            <Ionicons name="checkmark-circle" size={22} color="#ffc809" />
          </MotiView>
        ) : null}
      </Pressable>
    </MotiView>
  );
}

export function StateDropdownSheet({ visible, onClose, selectedCode, onSelect }: StateDropdownSheetProps) {
  const statesQuery = useOperatingStatesQuery();
  const states = (statesQuery.data as OperatingState[] | undefined) ?? [];

  function handleSelect(state: OperatingState) {
    onSelect(state);
    onClose();
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="Choose Location">
      {statesQuery.isLoading ? (
        <View className="items-center py-6">
          <LottieLoader label="Loading states..." />
        </View>
      ) : states.length === 0 ? (
        <View className="items-center py-8">
          <Ionicons name="location-outline" size={28} color="#9A9A9A" />
          <Text className="mt-2 text-sm text-hook-text">No operating states available yet.</Text>
        </View>
      ) : (
        <View className="gap-1">
          <StateRow
            state={ALL_STATES}
            icon="earth"
            isSelected={selectedCode === ALL_STATES.code}
            index={0}
            onPress={() => handleSelect(ALL_STATES)}
          />

          <View className="my-1.5 h-px bg-black/5" />

          {states.map((state, index) => (
            <StateRow
              key={state.code}
              state={state}
              icon="location"
              isSelected={state.code === selectedCode}
              index={index + 1}
              onPress={() => handleSelect(state)}
            />
          ))}
        </View>
      )}
    </BottomSheetModal>
  );
}
