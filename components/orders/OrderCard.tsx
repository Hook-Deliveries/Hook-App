import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { screenPadding } from "@/constants/design-tokens";

const THUMB = 60;
/** How far each thumbnail slides under the previous one. */
const OVERLAP = 16;
/** Beyond this, the rest collapse into a "+N" chip so the row cannot grow. */
const MAX_THUMBS = 3;

type OrderItem = { id?: string; title?: string; imageUrl?: string; quantity?: number };
type Order = {
  id: string;
  displayNumber?: string;
  statusLabel?: string;
  status?: string;
  itemCount?: number;
  items?: OrderItem[];
  paymentMethod?: string;
  totalMinor?: number;
  total?: number;
  createdAt?: string;
};

function naira(order: Order) {
  const minor = Number(order.totalMinor ?? Math.round(Number(order.total || 0) * 100));
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

function tone(order: Order) {
  const text = `${order.status || ""} ${order.statusLabel || ""}`.toLowerCase();
  if (/cancel|fail|refund|declin/.test(text)) return { bg: "#FDECEC", fg: "#B42318", dot: "#B42318" };
  if (/deliver|complete|paid|confirmed/.test(text) && !/out for|ready/.test(text)) return { bg: "#E6F6EC", fg: "#067647", dot: "#12B76A" };
  return { bg: "#FFF4C7", fg: "#7A5C00", dot: "#F5B800" };
}

function placed(order: Order) {
  return order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "";
}

/** One row in the orders list: status pill on top, stacked thumbnails with names, then date and total. */
export function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const items = order.items || [];
  const shown = items.slice(0, MAX_THUMBS);
  const overflow = Math.max(items.length - shown.length, 0);
  const count = Number(order.itemCount || items.length || 0);
  const statusLabel = order.statusLabel || String(order.status || "").replaceAll("_", " ");
  const colors = tone(order);
  const firstTitle = items[0]?.title;
  const summary = firstTitle ? (count > 1 ? `${firstTitle} + ${count - 1} more` : firstTitle) : `${count} item${count === 1 ? "" : "s"}`;
  const payment = String(order.paymentMethod || "").toUpperCase() === "PREPAID" ? "Prepaid" : String(order.paymentMethod || "").replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
  const when = placed(order);

  return (
    <Pressable onPress={onPress} className="overflow-hidden rounded-[22px] bg-white active:opacity-90" style={{ padding: screenPadding }}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 shrink">
          <Text className="text-[16px] font-black" numberOfLines={1}>{order.displayNumber || order.id}</Text>
          {when ? <Text className="mt-0.5 text-xs text-[#888]">{when}</Text> : null}
        </View>
        <View className="shrink flex-row items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: colors.bg }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.dot }} />
          <Text className="shrink text-[11px] font-bold" style={{ color: colors.fg }} numberOfLines={1}>{statusLabel}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-3">
        {shown.length ? (
          <View className="flex-row items-center">
            {shown.map((item, index) => (
              <View
                key={item.id || `${order.id}-${index}`}
                style={{
                  width: THUMB, height: THUMB, borderRadius: 16, overflow: "hidden", backgroundColor: "#F1F1F3",
                  borderWidth: 2, borderColor: "#FFFFFF", marginLeft: index === 0 ? 0 : -OVERLAP, zIndex: shown.length - index,
                }}
              >
                <RemoteImage uri={item.imageUrl} fallbackIcon="cube-outline" />
              </View>
            ))}
            {overflow ? (
              <View style={{ height: THUMB, minWidth: THUMB, paddingHorizontal: 8, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#111111", borderWidth: 2, borderColor: "#FFFFFF", marginLeft: -OVERLAP }}>
                <Text className="text-[13px] font-black text-white">+{overflow}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-bold text-[#222]" numberOfLines={2}>{summary}</Text>
          <Text className="mt-1 text-xs text-[#888]" numberOfLines={1}>{count} item{count === 1 ? "" : "s"}{payment ? ` · ${payment}` : ""}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-black/5 pt-3">
        <View>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-[#999]">Total</Text>
          <Text className="text-xl font-black">{naira(order)}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-[13px] font-black text-[#111]">View details</Text>
          <Ionicons name="chevron-forward" size={16} color="#111" />
        </View>
      </View>
    </Pressable>
  );
}
