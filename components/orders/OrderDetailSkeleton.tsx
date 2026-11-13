import React from "react";
import { View } from "react-native";

import { SkeletonBlock, SkeletonGroup } from "@/components/motion/Skeleton";
import { screenPadding } from "@/constants/design-tokens";

const card = { backgroundColor: "#fff", borderRadius: 22, padding: 16 } as const;

function Line({ label, value }: { label: number | string; value: number | string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <SkeletonBlock width={label} height={13} />
      <SkeletonBlock width={value} height={13} />
    </View>
  );
}

/** Mirrors the loaded Order Details layout, card for card, so the page doesn't jump when data arrives. */
export function OrderDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading order" style={{ paddingHorizontal: screenPadding, paddingTop: screenPadding, gap: 16 }}>
      {/* Hero: order number, date, status pill, then three stats */}
      <View style={{ backgroundColor: "#111", borderRadius: 24, padding: 20 }}>
        <SkeletonBlock width={150} height={22} radius={8} style={{ backgroundColor: "#2c2c2e" }} />
        <SkeletonBlock width={110} height={11} style={{ marginTop: 10, backgroundColor: "#2c2c2e" }} />
        <SkeletonBlock width={130} height={28} radius={14} style={{ marginTop: 14, backgroundColor: "#3a3a3c" }} />
        <View style={{ flexDirection: "row", gap: 12, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)" }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flex: 1, gap: 8 }}>
              <SkeletonBlock width={40} height={10} style={{ backgroundColor: "#2c2c2e" }} />
              <SkeletonBlock width="75%" height={18} style={{ backgroundColor: "#3a3a3c" }} />
            </View>
          ))}
        </View>
      </View>

      {/* Delivery information */}
      <View style={card}>
        <SkeletonBlock width={150} height={17} />
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <SkeletonBlock width={40} height={40} radius={20} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBlock width={110} height={11} />
            <SkeletonBlock width="95%" height={13} />
            <SkeletonBlock width="60%" height={13} />
          </View>
        </View>
      </View>

      {/* Receipt row */}
      <View style={{ ...card, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <SkeletonBlock width={44} height={44} radius={22} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBlock width={80} height={10} />
          <SkeletonBlock width={150} height={15} />
        </View>
        <SkeletonBlock width={100} height={32} radius={16} />
      </View>

      {/* Items */}
      <View style={card}>
        <SkeletonBlock width={60} height={17} />
        {[0, 1].map((i) => (
          <View key={i} style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <SkeletonBlock width={80} height={80} radius={16} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <SkeletonBlock width="55%" height={14} />
                <SkeletonBlock width={64} height={14} />
              </View>
              <SkeletonBlock width="40%" height={11} />
              <SkeletonBlock width="30%" height={11} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
      </View>

      {/* Order summary */}
      <View style={card}>
        <SkeletonBlock width={120} height={17} />
        <View style={{ gap: 14, marginTop: 16 }}>
          <Line label={70} value={70} />
          <Line label={90} value={60} />
          <Line label={60} value={55} />
          <View style={{ borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)", paddingTop: 16, flexDirection: "row", justifyContent: "space-between" }}>
            <SkeletonBlock width={50} height={16} />
            <SkeletonBlock width={110} height={22} />
          </View>
        </View>
      </View>

      {/* Tracking journey */}
      <View style={card}>
        <SkeletonBlock width={70} height={11} />
        <SkeletonBlock width="100%" height={92} radius={16} style={{ marginTop: 12 }} />
        <View style={{ gap: 18, marginTop: 20 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <SkeletonBlock width={24} height={24} radius={12} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBlock width={`${70 - i * 8}%`} height={13} />
                <SkeletonBlock width="40%" height={10} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </SkeletonGroup>
  );
}
