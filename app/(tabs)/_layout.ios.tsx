import { router } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { countActiveNegotiations } from "@/lib/negotiations";
import { useNegotiationsQuery } from "@/lib/mobile-api";

const hookYellow = "#FFC809";
const tabInkMuted = "#B2B2B5";

function badgeText(count: number) {
  return count > 99 ? "99+" : String(count);
}

export default function IOSNativeTabLayout() {
  const negotiations = useNegotiationsQuery();
  const activeNegotiations = countActiveNegotiations(
    Array.isArray(negotiations.data) ? negotiations.data : [],
  );

  // if (Number.parseInt(String(Platform.Version), 10) < 26)
  //   return <LegacyIOSTabs />;

  return (
    <NativeTabs
      backgroundColor="#FFFFFF"
      blurEffect="systemChromeMaterialLight"
      iconColor={{ default: tabInkMuted, selected: hookYellow }}
      labelStyle={{
        default: { color: tabInkMuted },
        selected: { color: hookYellow, fontWeight: "700" },
      }}
      badgeBackgroundColor={hookYellow}
      shadowColor="#0000001A"
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" />
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="offers">
        <NativeTabs.Trigger.Icon
          sf={{ default: "tag", selected: "tag.fill" }}
        />
        <NativeTabs.Trigger.Label>Offers</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge hidden={!activeNegotiations}>
          {activeNegotiations ? badgeText(activeNegotiations) : ""}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/*
        The cart opens as its own page (back button, full-width checkout bar, no tab bar) rather than as a tab. A disabled
        native tab never becomes selected, but still reports the tap, so the tap pushes the standalone cart route instead.
      */}
      <NativeTabs.Trigger
        name="cart"
        role="search"
        disabled
        listeners={{ tabPress: () => router.push("/(app)/cart" as never) }}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "cart", selected: "cart.fill" }}
        />
        <NativeTabs.Trigger.Label>Cart</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
