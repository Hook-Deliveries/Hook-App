import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import chatIcon from "@/assets/images/auth/chat-icon.png";
import { AuthGlowBackground } from "@/components/shared/glow-background";

const MIN_LENGTH = 9;

export function CreatePassword({ email }: { email: string }) {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const hasError = touched && password.length < MIN_LENGTH;
  const isValid = password.length >= MIN_LENGTH;

  function handleContinue() {
    setTouched(true);
    if (!isValid) return;
    router.push({ pathname: '/auth/verify-email', params: { email } });
  }

  function handleFocus() {
    setTimeout(
      () => scrollRef.current?.scrollTo({ y: 200, animated: true }),
      100,
    );
  }

  return (
    <View className="flex-1 bg-white">
      <AuthGlowBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Back button */}
          <View className="px-4" style={{ paddingTop: insets.top + 8 }}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              className="h-[49px] w-[49px] items-center justify-center rounded-[24.5px] border border-white/35 bg-white/[0.18]"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={22} color="#000" />
            </Pressable>
          </View>

          {/* Content */}
          <View className="flex-1 px-4 pb-4 pt-[34px]">
            <Image source={chatIcon} resizeMode="contain" />

            {/* Heading */}
            <View className="mt-[34px] gap-1.5">
              <Text className="text-[28px] font-bold leading-9 text-black">
                Create a password
              </Text>
              <Text className="text-base leading-[22px] text-hook-text">
                Add a way to protect your account{" "}
                <Text className="font-medium text-[#121212]">{email}</Text>
              </Text>
            </View>

            {/* Input group */}
            <View className="mt-[34px] gap-2.5">
              {/* Password field */}
              <View
                className={`h-[50px] flex-row items-center rounded-[6.6px] border-[1.3px] bg-white px-4 ${
                  hasError ? "border-[#ef4444]" : "border-[#90a1b9]"
                }`}
              >
                <TextInput
                  ref={inputRef}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-sm text-black"
                  placeholder="Password"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  secureTextEntry={!visible}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (touched && v.length >= MIN_LENGTH) setTouched(false);
                  }}
                  onFocus={handleFocus}
                  onSubmitEditing={handleContinue}
                  returnKeyType="done"
                />
                <Pressable
                  accessibilityLabel={
                    visible ? "Hide password" : "Show password"
                  }
                  hitSlop={8}
                  onPress={() => setVisible((v) => !v)}
                >
                  <Ionicons
                    name={visible ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#90a1b9"
                  />
                </Pressable>
              </View>

              <Text
                className={`text-sm ${
                  hasError
                    ? "text-[#ef4444]"
                    : isValid
                      ? "text-green-500"
                      : "text-hook-text"
                }`}
              >
                {hasError
                  ? `Must be at least ${MIN_LENGTH} characters`
                  : isValid
                    ? "✓ Password looks good"
                    : `Must contain at least ${MIN_LENGTH} characters`}
              </Text>
            </View>
          </View>

          {/* Continue — pinned at bottom */}
          <View className="px-4" style={{ paddingBottom: insets.bottom + 20 }}>
            <Pressable
              accessibilityRole="button"
              className={`h-[52px] items-center justify-center rounded-full ${
                isValid ? "bg-hook" : "bg-[rgba(20,19,15,0.5)]"
              }`}
              onPress={handleContinue}
            >
              <Text
                className={`text-sm font-medium ${isValid ? "text-black" : "text-white"}`}
              >
                continue
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
