import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAuthSheet } from "@/components/auth/AuthSheetProvider";
import { useCustomerSessionQuery, useNotificationsQuery } from "@/lib/mobile-api";
import { isCustomerSession } from "@/lib/session";

// The bell shown across marketplace headers: a white 44pt circle that pairs with the profile button,
// with a small dark count badge ringed in the header yellow so it never clashes with the page.
export function NotificationBellButton({ color = "#111" }: { color?: string }) {
  const session = useCustomerSessionQuery();
  const { openAuth } = useAuthSheet();
  const signedIn = isCustomerSession(session.data);
  const notifications = useNotificationsQuery();
  const unread = signedIn ? Number((notifications.data as { unread?: number } | undefined)?.unread || 0) : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `Open notifications, ${unread} unread` : "Open notifications"}
      onPress={() => (signedIn ? router.push("/notifications" as never) : openAuth("/notifications" as never))}
      hitSlop={6}
      style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}
    >
      <Ionicons name={unread > 0 ? "notifications" : "notifications-outline"} size={21} color={color} />
      {unread > 0 ? (
        <View
          pointerEvents="none"
          className="absolute -right-1 -top-1 h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-[#FFD93E] bg-[#111] px-1"
        >
          <Text className="text-[10px] font-extrabold leading-[12px] text-[#FFD93E]">{unread > 9 ? "9+" : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
