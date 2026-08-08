import { AntDesign, Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import authStartGif from "@/assets/images/onboarding/auth-start.gif";
import { GlassButton } from "@/components/shared/GlassButton";
import { HookLoader } from "@/components/shared/HookLoader";
import { toast } from "@/components/shared/toast";
import { useLookupEmailMutation } from "@/lib/auth-api";
import { useHookGoogleAuth } from "@/lib/google-auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthStart() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const insets = useSafeAreaInsets();
  const lookupEmail = useLookupEmailMutation();
  const { isGoogleLoading, isGoogleReady, signInWithGoogle } =
    useHookGoogleAuth();
  const sheetRef = useRef<BottomSheet>(null);
  const inputRef = useRef<React.ElementRef<typeof BottomSheetTextInput>>(null);
  const inputFocusedRef = useRef(false);
  const snapPoints = useMemo(() => ["60%", "100%"], []);
  const loading = lookupEmail.isPending;

  const collapseSheet = useCallback(() => {
    inputFocusedRef.current = false;
    sheetRef.current?.snapToIndex(0);
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", collapseSheet);
    return () => subscription.remove();
  }, [collapseSheet]);

  function handleInputFocus() {
    inputFocusedRef.current = true;
    sheetRef.current?.expand();
  }

  function handleInputBlur() {
    collapseSheet();
  }

  function handleSheetChange(index: number) {
    if (index === 1 && !inputFocusedRef.current) {
      sheetRef.current?.snapToIndex(0);
    }
  }

  function handleApplePress() {
    toast.info("Coming soon", "👀 Stay tuned");
  }

  async function handleContinue() {
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    try {
      const result = await lookupEmail.mutateAsync(trimmed);
      if (result.nextStep === "password") {
        router.push({ pathname: "/auth/password", params: { email: trimmed } });
        return;
      }
      if (result.nextStep === "verify_email") {
        toast.info(
          "Continue signup",
          "Create your password again to resend your code.",
        );
        router.push({
          pathname: "/auth/create-password",
          params: { email: trimmed },
        });
        return;
      }
      if (result.nextStep === "complete_profile") {
        toast.info(
          "Continue signup",
          "Create your password again to finish securely.",
        );
        router.push({
          pathname: "/auth/create-password",
          params: { email: trimmed },
        });
        return;
      }
      router.push({
        pathname: "/auth/create-password",
        params: { email: trimmed },
      });
    } catch (error) {
      toast.error(
        "Could not continue",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  return (
    <View className="flex-1 bg-hook-surface">
      <View className="h-[319px] w-full overflow-hidden bg-hook">
        <Image
          source={authStartGif}
          contentFit="cover"
          style={{ width: "100%", height: 319 }}
        />
        <GlassButton
          accessibilityRole="button"
          className="absolute right-4 top-14 px-4 py-2"
          onPress={() => router.push("/auth/guest-mode")}
        >
          <Text className="text-sm font-semibold text-black">Continue as guest</Text>
        </GlassButton>
      </View>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        topInset={insets.top}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        enableOverDrag={false}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="none"
        android_keyboardInputMode="adjustResize"
        handleComponent={null}
        onChange={handleSheetChange}
        backgroundStyle={{ backgroundColor: "#F1F1F3", borderRadius: 24 }}
        style={{ shadowOpacity: 0, elevation: 0 }}
      >
        <BottomSheetScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingBottom: 44,
            paddingTop: 14,
          }}
        >
          {/* Heading */}
          <View className="gap-1">
            <Text className="text-[28px] font-bold leading-9 text-black">
              Welcome to Hook
            </Text>
            <Text className="text-base text-hook-text">
              Enter your email to sign in or create an account
            </Text>
          </View>

          {/* Input card */}
          <View className="mt-5 rounded-[20px] bg-white p-3.5">
            {/* E-mail pill label */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-hook-text">
                Continue with
              </Text>
              <View className="h-[33px] w-[92px] items-center justify-center rounded-full bg-hook">
                <Text className="text-sm text-black">E-mail</Text>
              </View>
            </View>

            {/* Email input */}
            <BottomSheetTextInput
              ref={inputRef}
              autoCapitalize="none"
              autoCorrect={false}
              className={`mt-5 h-[52px] rounded-full bg-hook-surface px-5 text-sm text-black border-[1.5px] ${
                emailError ? "border-[#ef4444]" : "border-transparent"
              }`}
              keyboardType="email-address"
              placeholder="hook@gmail.com"
              placeholderTextColor="rgba(0,0,0,0.51)"
              returnKeyType="done"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setEmailError(false);
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onSubmitEditing={handleContinue}
            />
            {emailError && (
              <Text className="ml-4 mt-1.5 text-sm text-[#ef4444]">
                Please enter a valid email address
              </Text>
            )}

            {/* Continue */}
            <Pressable
              accessibilityRole="button"
              className="mt-5 h-[52px] items-center justify-center rounded-full bg-hook"
              disabled={loading}
              onPress={handleContinue}
            >
              {loading ? (
                <HookLoader size="button" variant="dark" />
              ) : (
                <Text className="text-base font-medium text-black">
                  Continue
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            className="mt-4 items-center self-center px-5 py-2"
            onPress={() =>
              router.push({
                pathname: "/auth/forgot-password",
                params: { email: email.trim() },
              })
            }
          >
            <Text className="text-sm font-medium text-black">
              Forgot password?
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="mt-4 flex-row items-center gap-4">
            <View className="h-px flex-1 bg-black/20" />
            <Text className="text-sm text-hook-text">Or with</Text>
            <View className="h-px flex-1 bg-black/20" />
          </View>

          {/* Social buttons */}
          <View className="mt-5 flex-row justify-center gap-3.5">
            <SocialButton
              accessibilityLabel="Continue with Google"
              disabled={!isGoogleReady || isGoogleLoading}
              onPress={signInWithGoogle}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#FFC809" size="small" />
              ) : (
                <AntDesign name="google" size={21} color="#4285f4" />
              )}
            </SocialButton>
            <SocialButton
              accessibilityLabel="Continue with Apple"
              onPress={handleApplePress}
            >
              <Ionicons name="logo-apple" size={24} color="#000" />
            </SocialButton>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

function SocialButton({
  accessibilityLabel,
  children,
  disabled,
  onPress,
}: {
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={`h-10 w-10 items-center justify-center rounded-full bg-white ${disabled ? "opacity-60" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}
