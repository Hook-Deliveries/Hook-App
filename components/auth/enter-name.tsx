import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import chatIcon from '@/assets/images/auth/chat-icon.png';

export function EnterName({ email }: { email: string }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const isValid = name.trim().length >= 2;

  function handleFocus() {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 200, animated: true }), 100);
  }

  function handleContinue() {
    if (!isValid) return;
    router.replace('/auth/congratulations');
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f1f3' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>

          {/* Back button */}
          <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              style={{
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderColor: 'rgba(255,255,255,0.35)',
                borderRadius: 24.5,
                borderWidth: 1,
                elevation: 4,
                height: 49,
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                width: 49,
              }}
              onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#000" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 45, paddingBottom: 16 }}>
            <Image source={chatIcon} resizeMode="contain" style={{ width: 49, height: 48 }} />

            <View style={{ marginTop: 34, gap: 6 }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#000', lineHeight: 36 }}>
                Enter Name
              </Text>
              <Text style={{ fontSize: 16, color: '#414040', lineHeight: 22 }}>
                Add a way to protect your account{' '}
                <Text style={{ color: '#121212', fontWeight: '500' }}>{email}</Text>
              </Text>
            </View>

            <View style={{ marginTop: 34 }}>
              <TextInput
                ref={inputRef}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Your full name"
                placeholderTextColor="rgba(0,0,0,0.35)"
                style={{
                  backgroundColor: '#fff',
                  borderColor: '#90a1b9',
                  borderRadius: 6.6,
                  borderWidth: 1.3,
                  color: '#000',
                  fontSize: 14,
                  height: 50,
                  paddingHorizontal: 16,
                }}
                value={name}
                onChangeText={setName}
                onFocus={handleFocus}
                onSubmitEditing={handleContinue}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Continue */}
          <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}>
            <Pressable
              accessibilityRole="button"
              style={{
                alignItems: 'center',
                backgroundColor: isValid ? '#FFC809' : 'rgba(20,19,15,0.5)',
                borderRadius: 50,
                height: 52,
                justifyContent: 'center',
              }}
              onPress={handleContinue}>
              <Text style={{ color: isValid ? '#000' : '#fff', fontSize: 14, fontWeight: '500' }}>
                continue
              </Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
