import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

/**
 * Connection health as the app actually experiences it, from two sources that
 * back each other up:
 *
 *  1. NetInfo reports the device's own connectivity (airplane mode, Wi-Fi
 *     without internet, no signal) the instant it changes, so the offline
 *     banner appears immediately instead of after two failed requests.
 *     NetInfo is pointed at Hook's own /health endpoint, so "reachable" means
 *     Hook is reachable and not a third-party site.
 *  2. Every API call reports its outcome. Two failures in a row mean offline
 *     even when NetInfo is unsure; two very slow calls (or a 2G cellular link)
 *     mean a weak signal.
 *
 * While offline a light probe checks the server until it answers again, and a
 * NetInfo "back online" event triggers that check right away, so the banner
 * clears as soon as the network is genuinely usable.
 */
export type NetworkState = "online" | "slow" | "offline" | "restored";

const SLOW_MS = 6000;
const PROBE_MS = 4000;
const RESTORED_MS = 2600;

type NetInfoModule = typeof import("@react-native-community/netinfo");
type NetInfoState = import("@react-native-community/netinfo").NetInfoState;

// The native module is missing in Expo Go and in builds made before this
// package was added. Load it lazily so a missing module never crashes the app;
// the request-based checks below keep working on their own.
let netInfo: NetInfoModule["default"] | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded lazily so a missing native module never crashes the app
  netInfo = require("@react-native-community/netinfo").default;
} catch {
  netInfo = null;
}

let state: NetworkState = "online";
let failures = 0;
let slowRuns = 0;
let deviceOffline = false;
let weakCellular = false;
let probe: ReturnType<typeof setInterval> | null = null;
let restoreTimer: ReturnType<typeof setTimeout> | null = null;
let healthUrl = "";
let monitorStarted = false;
const listeners = new Set<() => void>();

function set(next: NetworkState) {
  if (next === state) return;
  state = next;
  onlineManager.setOnline(next !== "offline");
  listeners.forEach((listener) => listener());
}

/** Online and slow are the same connection at different quality; pick whichever the evidence says. */
function settleOnlineQuality() {
  if (state !== "online" && state !== "slow") return;
  set(weakCellular || slowRuns >= 2 ? "slow" : "online");
}

async function ping() {
  if (!healthUrl) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(healthUrl, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (response.status < 500) recovered();
  } catch {
    // Still offline; the next probe tries again.
  } finally {
    clearTimeout(timer);
  }
}

function startProbe() {
  if (probe) return;
  probe = setInterval(() => void ping(), PROBE_MS);
}

function stopProbe() {
  if (probe) clearInterval(probe);
  probe = null;
}

function goOffline() {
  if (restoreTimer) clearTimeout(restoreTimer);
  set("offline");
  startProbe();
}

function recovered() {
  const wasOffline = state === "offline";
  failures = 0;
  slowRuns = 0;
  deviceOffline = false;
  stopProbe();
  if (wasOffline) {
    set("restored");
    if (restoreTimer) clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => {
      set("online");
      settleOnlineQuality();
    }, RESTORED_MS);
  } else {
    settleOnlineQuality();
  }
}

/** Turns a NetInfo reading into app state. `isInternetReachable` is null while NetInfo is still unsure, which is not offline. */
function applyDevice(info: NetInfoState) {
  const offline = info.isConnected === false || info.isInternetReachable === false;
  weakCellular = info.type === "cellular" && info.isConnected === true && (info.details as { cellularGeneration?: string | null } | null)?.cellularGeneration === "2g";

  if (offline) {
    deviceOffline = true;
    if (state !== "offline") goOffline();
    return;
  }
  if (deviceOffline || state === "offline") {
    // The device says it is back; confirm Hook actually answers before announcing it.
    deviceOffline = false;
    void ping();
    return;
  }
  settleOnlineQuality();
}

/** Starts listening to the device's connectivity. Safe to call more than once. */
function startMonitor() {
  if (monitorStarted || !netInfo) return;
  monitorStarted = true;
  const module = netInfo;
  // The listener fires once straight away with the current state, so no separate fetch is needed.
  module.addEventListener(applyDevice);
  AppState.addEventListener("change", (appState) => {
    if (appState !== "active") return;
    // A phone that slept or lost signal in the background can miss events; re-read it on return.
    void module.refresh().then(applyDevice).catch(() => undefined);
    if (state === "offline") void ping();
  });
}

/** Tell the monitor where the server's /health lives (the API origin) and start watching the device's connection. */
export function configureNetworkProbe(apiBaseUrl: string) {
  healthUrl = `${apiBaseUrl.replace(/\/api\/v\d+\/?$/, "")}/health`;
  if (netInfo) {
    // Judge "internet reachable" by Hook's own server, not a third-party URL that some networks block.
    netInfo.configure({
      reachabilityUrl: healthUrl,
      reachabilityMethod: "GET",
      reachabilityTest: async (response) => response.status < 500,
      reachabilityLongTimeout: 30 * 1000,
      reachabilityShortTimeout: 5 * 1000,
      reachabilityRequestTimeout: 8 * 1000,
      useNativeReachability: false,
    });
  }
  startMonitor();
}

/** Called by the API layer after every request. */
export function reportRequest(outcome: "ok" | "failed", durationMs: number) {
  if (outcome === "failed") {
    failures += 1;
    if (failures >= 2 && state !== "offline") goOffline();
    return;
  }
  failures = 0;
  if (state === "offline") {
    recovered();
    return;
  }
  if (durationMs > SLOW_MS) {
    slowRuns += 1;
  } else {
    slowRuns = 0;
  }
  settleOnlineQuality();
}

export function useNetworkState(): NetworkState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => "online" as NetworkState,
  );
}

/** Lets a "Retry" button check right now instead of waiting for the next probe. */
export function checkNetworkNow() {
  if (netInfo) void netInfo.refresh().then(applyDevice).catch(() => undefined);
  void ping();
}
