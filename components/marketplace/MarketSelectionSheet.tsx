import { Image } from "expo-image";
import { useEffect, useState } from "react";
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

import type { PublicMarket } from "@/lib/mobile-api";

import { MarketplaceSearch } from "./MarketplaceSearch";
import { ScallopedEdge } from "./ScallopedEdge";

const MARKET_ICON = require("../../assets/images/market-icon.png");

type MarketSelectionSheetProps = {
  visible: boolean;
  markets: PublicMarket[];
  selectedMarketId: string;
  onSelect: (marketId: string) => void;
  onClose: () => void;
};

const enterTransition = SlideInDown.springify()
  .damping(24)
  .stiffness(260)
  .mass(0.82);

const exitTransition = SlideOutDown.springify()
  .damping(26)
  .stiffness(300)
  .mass(0.86);

export function MarketSelectionSheet({
  visible,
  markets,
  selectedMarketId,
  onSelect,
  onClose,
}: MarketSelectionSheetProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearch("");
      setSearchFocused(false);
    }
  }, [visible]);

  const filteredMarkets = markets.filter((market) => {
    const value = search.trim().toLowerCase();
    return (
      !value ||
      `${market.name} ${market.address || ""}`.toLowerCase().includes(value)
    );
  });

  function select(marketId: string) {
    onSelect(marketId);
    onClose();
  }

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/45"
      >
        <Pressable
          accessibilityLabel="Close market selector"
          accessibilityRole="button"
          className="absolute inset-0"
          onPress={onClose}
        />
        <Animated.View
          accessibilityViewIsModal
          className={`relative w-full self-end bg-[#F1F1F3] px-4 ${searchFocused ? "flex-1 pt-8" : "max-h-[78%] min-h-[54%] rounded-t-[28px] pt-14"}`}
          entering={enterTransition}
          exiting={exitTransition}
          style={{
            marginTop: "auto",
            paddingBottom: Math.max(insets.bottom, 20),
            overflow: "visible",
          }}
        >
          <ScallopedEdge color="#F1F1F3" count={16} edge="top" size={26} />

          <View
            className={`absolute left-1/2 h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ${searchFocused ? "-top-7" : "-top-12"}`}
            style={{ zIndex: 50, elevation: 12 }}
          >
            <Image
              source={MARKET_ICON}
              contentFit="contain"
              accessibilityLabel="Market"
              style={{ width: 68, height: 68, zIndex: 51 }}
            />
          </View>

          <MarketplaceSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Search for market"
            returnKeyType="search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />

          <View className="mt-4 flex-1">
            <MarketOption
              label="All markets"
              selected={selectedMarketId === "all"}
              onPress={() => select("all")}
            />
            {filteredMarkets.map((market) => (
              <MarketOption
                key={market.publicId}
                label={market.name || market.shortDisplayName || "Market"}
                selected={selectedMarketId === market.publicId}
                onPress={() => select(market.publicId)}
              />
            ))}
            {!filteredMarkets.length ? (
              <View className="items-center px-6 py-12">
                <Text className="font-bold text-[#111]">No markets found</Text>
                <Text className="mt-1 text-center text-sm text-[#777]">
                  Try a different market name.
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MarketOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`mb-1.5 min-h-11 justify-center rounded-full px-4 ${selected ? "bg-[#DDE5F0]" : "bg-transparent"}`}
    >
      <Text numberOfLines={1} className="text-[17px] text-[#111]">
        {label}
      </Text>
    </Pressable>
  );
}
