import React from "react";
import { Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { colorName } from "@/lib/color-name";
import { barcodeRuns, qrMatrix, type ParcelReceiptInput } from "@/lib/receipt-html";

const INK = "#09090b";
const MUTED = "#71717a";
const MONO = "Menlo";
const fmt = (value?: string) => (value ? new Date(value).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

function Label({ children, color = MUTED }: { children: React.ReactNode; color?: string }) {
  return <Text style={{ fontSize: 9, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color }}>{children}</Text>;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ width: "50%", paddingRight: 8, marginBottom: 12 }}>
      <Label>{label}</Label>
      <Text style={{ marginTop: 3, fontSize: 13, fontWeight: "700", color: INK }}>{value || "—"}</Text>
    </View>
  );
}

function Qr({ value, size }: { value: string; size: number }) {
  const matrix = React.useMemo(() => qrMatrix(value), [value]);
  const path = React.useMemo(() => matrix.map((row, r) => row.map((dark, c) => (dark ? `M${c} ${r}h1v1h-1z` : "")).join("")).join(""), [matrix]);
  return <Svg width={size} height={size} viewBox={`0 0 ${matrix.length} ${matrix.length}`}><Path d={path} fill={INK} /></Svg>;
}

function Barcode({ value, height = 40 }: { value: string; height?: number }) {
  const runs = React.useMemo(() => barcodeRuns(value), [value]);
  const total = runs.reduce((sum, [, units]) => sum + units, 0);
  if (!total) return null;
  let x = 0;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${total} ${height}`} preserveAspectRatio="none">
      {runs.map(([bar, units], index) => {
        const rect = bar ? <Rect key={index} x={x} y={0} width={units} height={height} fill={INK} /> : null;
        x += units;
        return rect;
      })}
    </Svg>
  );
}

/** The customer's parcel receipt, drawn to match the hub's printed label (Hook-Admin HookReceipt) and the shared PDF. */
export function ParcelReceiptCard(data: ParcelReceiptInput) {
  const units = data.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const tracking = data.courier?.trackingNumber;
  const unitsLabel = `${units} unit${units === 1 ? "" : "s"}`;

  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 22, overflow: "hidden" }}>
      <View style={{ backgroundColor: INK, paddingHorizontal: 18, paddingVertical: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ color: "#fff", fontSize: 32, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8 }}>hook<Text style={{ color: "#ffc809" }}>.</Text></Text>
          <Label color="#a1a1aa">Parcel receipt</Label>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Label color="#a1a1aa">Receipt no.</Label>
          <Text style={{ marginTop: 2, color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: MONO }}>{data.receiptNumber}</Text>
        </View>
      </View>

      <View style={{ padding: 18, gap: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Label>Order</Label>
            <Text style={{ marginTop: 2, fontSize: 19, fontWeight: "900", fontFamily: MONO, color: INK }} numberOfLines={1} adjustsFontSizeToFit>{data.orderId || "—"}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Qr value={["HOOK", data.receiptNumber, data.orderId].join("|")} size={84} />
            <Text style={{ marginTop: 4, fontSize: 8, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", color: MUTED }}>Scan to verify</Text>
          </View>
        </View>

        <View style={{ borderWidth: 2, borderColor: INK, borderRadius: 6, padding: 12 }}>
          <Label>Deliver to</Label>
          <Text style={{ marginTop: 3, fontSize: 16, fontWeight: "900", color: INK }}>{data.recipient.name || "Customer"}</Text>
          {data.recipient.phone ? <Text style={{ fontSize: 13, fontWeight: "600", color: INK }}>{data.recipient.phone}</Text> : null}
          <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 18, color: INK }}>{data.recipient.address || "Address on file"}</Text>
        </View>

        <View style={{ backgroundColor: "#f4f4f5", borderRadius: 6, padding: 12, paddingBottom: 0, flexDirection: "row", flexWrap: "wrap" }}>
          <Field label="Courier" value={data.courier?.name} />
          <Field label="Tracking" value={tracking} />
          <Field label="Received at hub" value={fmt(data.receivedAt)} />
          <Field label="Payment" value={data.paymentLabel || "Prepaid"} />
          <Field label="Order placed" value={fmt(data.placedAt)} />
          <Field label="Items" value={unitsLabel} />
        </View>

        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", borderBottomWidth: 1, borderBottomColor: "#d4d4d8", paddingBottom: 6 }}>
            <Label>Contents</Label>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#52525b" }}>{unitsLabel}</Text>
          </View>
          {data.items.map((item, index) => {
            const sub = [item.color ? colorName(item.color) : undefined, item.size ? `Size ${item.size}` : undefined].filter(Boolean).join(" · ");
            return (
              <View key={`${item.title}-${index}`} style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, paddingVertical: 8, borderTopWidth: index ? 1 : 0, borderTopColor: "#e4e4e7" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: INK }}>{item.title}</Text>
                  {sub ? <Text style={{ marginTop: 1, fontSize: 12, color: "#52525b" }}>{sub}</Text> : null}
                </View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: INK }}>×{item.quantity}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ alignItems: "center" }}>
          <View style={{ width: "78%" }}><Barcode value={tracking || data.orderId || data.receiptNumber} /></View>
          <Text style={{ marginTop: 4, fontSize: 11, fontFamily: MONO, letterSpacing: 0.6, color: INK }}>{tracking || data.orderId}</Text>
          <Text style={{ marginTop: 2, fontSize: 8, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", color: MUTED }}>{tracking ? `${data.courier?.name || "Courier"} tracking` : "Order reference"}</Text>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: "#d4d4d8", paddingTop: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#3f3f46" }}>Received at hub {fmt(data.receivedAt)}</Text>
          <Text style={{ marginTop: 2, fontSize: 10, lineHeight: 14, color: MUTED }}>Handle with care. Open only in the presence of the recipient.</Text>
        </View>
      </View>
    </View>
  );
}
