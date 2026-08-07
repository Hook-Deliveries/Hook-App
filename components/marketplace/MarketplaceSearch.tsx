import { Ionicons } from "@expo/vector-icons";
import { TextInput, View } from "react-native";

type MarketplaceSearchProps = React.ComponentProps<typeof TextInput> & {
  iconPosition?: "left" | "right";
};

export function MarketplaceSearch({
  iconPosition = "left",
  className,
  ...props
}: MarketplaceSearchProps) {
  const input = (
    <TextInput
      {...props}
      placeholderTextColor="#B0B0B5"
      className={`flex-1 text-[15px] text-black ${className || ""}`}
    />
  );

  return (
    <View className="h-[50px] flex-row items-center rounded-[20px] bg-white px-4">
      {iconPosition === "left" ? (
        <Ionicons name="search" size={20} color="#98989D" />
      ) : null}
      {input}
      {iconPosition === "right" ? (
        <Ionicons name="search" size={20} color="#98989D" />
      ) : null}
    </View>
  );
}
