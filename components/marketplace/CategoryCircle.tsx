import { Pressable, Text, View } from "react-native";
import { RemoteImage } from "@/components/shared/RemoteImage";
import type { PublicCategory } from "@/lib/mobile-api";

const DEFAULT_CATEGORY_IMAGE = require("../../assets/images/figma/category-market-art.png");

export function CategoryCircle({
  category,
  selected,
  compact,
  onPress,
}: {
  category: PublicCategory;
  selected?: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  const size = compact ? 54 : 72;
  return (
    <Pressable
      onPress={onPress}
      className="items-center"
      style={{ width: compact ? 68 : 78 }}
    >
      <View
        className={`items-center justify-center overflow-hidden rounded-full ${selected ? "bg-black" : "bg-white"}`}
        style={{
          width: size,
          height: size,
          borderWidth: 6.771,
          borderColor: "#FFC809",
        }}
      >
        <RemoteImage
          uri={category.iconUrl}
          fallbackSource={DEFAULT_CATEGORY_IMAGE}
          contentFit="cover"
        />
      </View>
      <Text
        numberOfLines={1}
        className={`mt-1.5 text-center ${compact ? "text-[10px]" : "text-[11px]"} font-medium text-black`}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}
