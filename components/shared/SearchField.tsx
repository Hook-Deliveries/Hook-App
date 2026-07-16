import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type SearchFieldProps = {
  value?: string;
  onChangeText?: (value: string) => void;
  onPress?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchField({ value = '', onChangeText, onPress, placeholder = 'Search Hook', autoFocus }: SearchFieldProps) {
  const [focused, setFocused] = useState(false);
  const editable = Boolean(onChangeText);
  const shell = `h-14 flex-row items-center rounded-[18px] border bg-white px-4 ${focused ? 'border-hook' : 'border-black/5'}`;

  if (!editable) {
    return <Pressable accessibilityRole="search" accessibilityLabel={placeholder} onPress={onPress} className={shell} style={styles.shadow}><View className="h-8 w-8 items-center justify-center rounded-full bg-[#f3f3f4]"><Ionicons name="search" size={17} color="#555" /></View><Text numberOfLines={1} className="ml-3 flex-1 text-[14px] text-[#777]">{placeholder}</Text><View className="h-8 w-8 items-center justify-center rounded-full bg-hook"><Ionicons name="arrow-forward" size={16} color="#111" /></View></Pressable>;
  }

  return <View className={shell} style={styles.shadow}><Ionicons name="search" size={19} color={focused ? '#111' : '#777'} /><TextInput value={value} onChangeText={onChangeText} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder} placeholderTextColor="#999" returnKeyType="search" autoFocus={autoFocus} autoCapitalize="none" autoCorrect={false} clearButtonMode="never" selectionColor="#FFC809" className="ml-3 h-full flex-1 text-[15px] text-black" style={Platform.OS === 'android' ? styles.androidInput : undefined} />{value ? <Pressable accessibilityLabel="Clear search" onPress={() => onChangeText?.('')} hitSlop={10} className="h-8 w-8 items-center justify-center rounded-full bg-[#f1f1f3]"><Ionicons name="close" size={16} color="#555" /></Pressable> : <View className="rounded-full bg-hook/20 px-2.5 py-1"><Text className="text-[10px] font-bold text-[#555]">Search</Text></View>}</View>;
}

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  androidInput: { paddingVertical: 0 },
});
