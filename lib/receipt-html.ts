import JsBarcode from "jsbarcode";
import qrcode from "qrcode-generator";

import { colorName } from "@/lib/color-name";

export type ParcelReceiptInput = {
  receiptNumber: string;
  orderId: string;
  receivedAt?: string;
  placedAt?: string;
  recipient: { name?: string; phone?: string; address?: string };
  courier?: { name?: string; trackingNumber?: string };
  paymentLabel?: string;
  items: Array<{ title?: string; quantity?: number; color?: string; size?: string }>;
};

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const fmt = (value?: string) => (value ? new Date(value).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

/** Dark-module grid for a QR code, for native renderers. */
export function qrMatrix(value: string): boolean[][] {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  return Array.from({ length: count }, (_, r) => Array.from({ length: count }, (_, c) => qr.isDark(r, c)));
}

/** CODE128 as runs of [isBar, units], for native renderers. */
export function barcodeRuns(value: string): Array<[boolean, number]> {
  const result: { encodings?: Array<{ data: string }> } = {};
  try {
    JsBarcode(result, value, { format: "CODE128", margin: 0 });
  } catch {
    return [];
  }
  const bits = (result.encodings || []).map((entry) => entry.data).join("");
  const runs: Array<[boolean, number]> = [];
  for (let i = 0; i < bits.length; ) {
    let run = 1;
    while (bits[i + run] === bits[i]) run++;
    runs.push([bits[i] === "1", run]);
    i += run;
  }
  return runs;
}

/** QR as a crisp SVG (pure JS, no canvas needed). */
function qrSvg(value: string, size: number) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  let path = "";
  for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${count} ${count}" shape-rendering="crispEdges"><path d="${path}" fill="#09090b"/></svg>`;
}

/** CODE128 as SVG bars, using JsBarcode's renderer-free "object" mode so it works without a DOM. */
function barcodeSvg(value: string, height = 34, bar = 1.4) {
  const result: { encodings?: Array<{ data: string }> } = {};
  try {
    JsBarcode(result, value, { format: "CODE128", margin: 0 });
  } catch {
    return "";
  }
  const bits = (result.encodings || []).map((entry) => entry.data).join("");
  let x = 0;
  let bars = "";
  for (let i = 0; i < bits.length; ) {
    let run = 1;
    while (bits[i + run] === bits[i]) run++;
    if (bits[i] === "1") bars += `<rect x="${(x * bar).toFixed(2)}" y="0" width="${(run * bar).toFixed(2)}" height="${height}" fill="#09090b"/>`;
    x += run;
    i += run;
  }
  const width = (x * bar).toFixed(2);
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bars}</svg>`;
}

function field(label: string, value?: string) {
  return `<div class="f"><p class="k">${esc(label)}</p><p class="val">${esc(value || "—")}</p></div>`;
}

/** The customer copy of the Hook parcel receipt, laid out like the hub's printed label (Hook-Admin HookReceipt). */
export function parcelReceiptHtml(data: ParcelReceiptInput) {
  const units = data.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const tracking = data.courier?.trackingNumber;
  const items = data.items.map((item) => {
    const sub = [item.color ? colorName(item.color) : undefined, item.size ? `Size ${item.size}` : undefined].filter(Boolean).join(" · ");
    return `<li><span><b>${esc(item.title)}</b>${sub ? `<em>${esc(sub)}</em>` : ""}</span><strong>×${esc(item.quantity)}</strong></li>`;
  }).join("");
  const code = barcodeSvg(tracking || data.orderId);
  return `<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;background:#fff;color:#09090b;-webkit-print-color-adjust:exact}
    .mono{font-family:ui-monospace,Menlo,Courier,monospace}
    .hd{background:#09090b;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
    .logo{font-size:30px;line-height:1;font-weight:800;letter-spacing:-.02em}.logo i{font-style:normal;color:#ffc809}
    .sub{margin-top:4px;font-size:8px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#a1a1aa}
    .rn{text-align:right}.rn p:first-child{font-size:8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#a1a1aa}
    .rn p:last-child{font-size:14px;font-weight:700}
    .bd{padding:16px;display:flex;flex-direction:column;gap:12px}
    .k{font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#71717a}
    .top{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .oid{font-size:20px;font-weight:900;line-height:1.2;margin-top:2px}
    .qr{text-align:center}.qr p{margin-top:4px;font-size:7px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#71717a}
    .to{border:2px solid #09090b;border-radius:4px;padding:10px}
    .to .n{margin-top:2px;font-size:14px;font-weight:900;line-height:1.2}.to .p{font-size:11px;font-weight:600}.to .a{margin-top:4px;font-size:11px;line-height:1.35}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;background:#f4f4f5;border-radius:4px;padding:10px}
    .val{margin-top:2px;font-size:11px;font-weight:600;line-height:1.2}
    .ch{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #d4d4d8;padding-bottom:4px}.ch span{font-size:10px;font-weight:600;color:#52525b}
    ul{list-style:none}li{display:flex;justify-content:space-between;gap:8px;padding:4px 0;font-size:11px;border-top:1px solid #e4e4e7}li:first-child{border-top:0}
    li b{font-weight:600}li em{display:block;font-style:normal;font-size:10px;color:#52525b}li strong{font-weight:700}
    .bc{text-align:center}.bc .t{margin-top:2px;font-size:10px;letter-spacing:.05em}.bc .c{margin-top:2px;font-size:7px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#71717a}
    .ft{border-top:1px solid #d4d4d8;padding-top:8px;font-size:9px;line-height:1.35;color:#71717a}.ft b{display:block;color:#3f3f46;font-weight:600}
  </style></head><body>
    <div class="hd"><div><div class="logo">hook<i>.</i></div><p class="sub">Parcel receipt</p></div><div class="rn"><p>Receipt no.</p><p class="mono">${esc(data.receiptNumber)}</p></div></div>
    <div class="bd">
      <div class="top"><div><p class="k">Order</p><p class="oid mono">${esc(data.orderId)}</p></div><div class="qr">${qrSvg(["HOOK", data.receiptNumber, data.orderId].join("|"), 84)}<p>Scan to verify</p></div></div>
      <div class="to"><p class="k">Deliver to</p><p class="n">${esc(data.recipient.name || "Customer")}</p>${data.recipient.phone ? `<p class="p">${esc(data.recipient.phone)}</p>` : ""}<p class="a">${esc(data.recipient.address || "Address on file")}</p></div>
      <div class="grid">${field("Courier", data.courier?.name)}${field("Tracking", tracking)}${field("Received at hub", fmt(data.receivedAt))}${field("Payment", data.paymentLabel || "Prepaid")}${field("Order placed", fmt(data.placedAt))}${field("Items", `${units} unit${units === 1 ? "" : "s"}`)}</div>
      <div><div class="ch"><p class="k">Contents</p><span>${units} unit${units === 1 ? "" : "s"}</span></div><ul>${items}</ul></div>
      <div class="bc">${code}<p class="t mono">${esc(tracking || data.orderId)}</p><p class="c">${tracking ? `${esc(data.courier?.name || "Courier")} tracking` : "Order reference"}</p></div>
      <div class="ft"><b>Received at hub ${esc(fmt(data.receivedAt))}</b><p>Handle with care. Open only in the presence of the recipient. Generated ${esc(fmt(new Date().toISOString()))}.</p></div>
    </div>
  </body></html>`;
}
