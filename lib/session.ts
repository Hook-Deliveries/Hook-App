import * as SecureStore from "expo-secure-store";

export type HookUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: string;
  isEmailVerified?: boolean;
  publicId?: string;
  accountType?: "customer" | "staff" | "runner" | "partner";
  accountStatus?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: HookUser;
};

const NON_CUSTOMER_ROLES = new Set([
  "admin",
  "support",
  "super_admin",
  "operations_lead",
  "state_operations_manager",
  "commercial_manager",
  "commercial_officer",
  "catalog_reviewer",
  "dispatch_hub_manager",
  "dispatch_hub_officer",
  "logistics_officer",
  "customer_support_officer",
  "finance_officer",
  "management_viewer",
  "runner",
  "partner",
  "field_agent",
  "vendor",
  "ev_driver",
]);

/** Handles sessions created by older app builds that did not persist accountType. */
export function isCustomerSession(session: AuthSession | null | undefined) {
  if (!session?.accessToken) return false;
  if (session.user.accountType === "customer") return true;
  if (session.user.accountType === "staff" || session.user.accountType === "runner" || session.user.accountType === "partner") return false;
  const role = String(session.user.role || "").trim().toLowerCase();
  return !NON_CUSTOMER_ROLES.has(role);
}

export type PendingSignup = {
  email: string;
  signupSessionToken: string;
  step: "verify_email" | "complete_profile";
};

const KEYS = {
  session: "hook.auth.session",
  guestSession: "hook.guest.session",
  onboarding: "hook.onboarding.complete",
  pendingSignup: "hook.signup.pending",
};

type SessionListener = () => void;
const sessionListeners = new Set<SessionListener>();

function notifySessionChanged() {
  sessionListeners.forEach((listener) => listener());
}

export function onSessionChanged(listener: SessionListener) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

export type StoredGuestSession = {
  token: string;
  guest: { publicId: string; expiresAt: string };
};

async function getJson<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setJson(key: string, value: unknown) {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export function getSession() {
  return getJson<AuthSession>(KEYS.session);
}

export async function saveSession(session: AuthSession) {
  await setJson(KEYS.session, session);
  notifySessionChanged();
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(KEYS.session);
  notifySessionChanged();
}

export async function getGuestId() {
  return (
    (await getJson<StoredGuestSession>(KEYS.guestSession))?.guest.publicId ||
    null
  );
}

export async function ensureGuestId() {
  const existing = await getGuestSession();
  if (existing && new Date(existing.guest.expiresAt) > new Date())
    return existing.guest.publicId;
  const apiBase =
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  const response = await fetch(`${apiBase}/guest-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ platform: "unknown" }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.success || !payload?.data?.token) {
    throw new Error(payload?.error?.message || "Unable to start guest session");
  }
  await saveGuestSession(payload.data);
  return payload.data.guest.publicId as string;
}

export async function restoreGuestSession() {
  const existing = await getGuestSession();
  if (!existing) return null;

  if (new Date(existing.guest.expiresAt) <= new Date()) {
    await clearGuestId();
    return null;
  }

  const apiBase =
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  try {
    const response = await fetch(`${apiBase}/guest-sessions/current`, {
      headers: {
        Accept: "application/json",
        "X-Guest-Session": existing.token,
      },
    });

    if (response.status === 401) {
      await clearGuestId();
      return null;
    }

    if (!response.ok) return existing;
    const payload = await response.json();
    if (!payload?.success || !payload?.data?.publicId) return existing;

    const restored: StoredGuestSession = {
      token: existing.token,
      guest: {
        publicId: payload.data.publicId,
        expiresAt: payload.data.expiresAt || existing.guest.expiresAt,
      },
    };
    await saveGuestSession(restored);
    return restored;
  } catch {
    // Preserve a locally valid guest session while the device is offline.
    return existing;
  }
}

export function getGuestSession() {
  return getJson<StoredGuestSession>(KEYS.guestSession);
}

export async function saveGuestSession(session: StoredGuestSession) {
  await setJson(KEYS.guestSession, session);
  notifySessionChanged();
}

export async function clearGuestId() {
  await SecureStore.deleteItemAsync(KEYS.guestSession);
  notifySessionChanged();
}

export async function getPendingSignup() {
  return getJson<PendingSignup>(KEYS.pendingSignup);
}

export async function savePendingSignup(pending: PendingSignup) {
  await setJson(KEYS.pendingSignup, pending);
}

export async function clearPendingSignup() {
  await SecureStore.deleteItemAsync(KEYS.pendingSignup);
}

export async function getOnboardingComplete() {
  return (await SecureStore.getItemAsync(KEYS.onboarding)) === "true";
}

export async function setOnboardingComplete(value = true) {
  await SecureStore.setItemAsync(KEYS.onboarding, value ? "true" : "false");
}
