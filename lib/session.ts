import * as SecureStore from 'expo-secure-store';

export type HookUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: string;
  isEmailVerified?: boolean;
  publicId?: string;
  accountType?: 'customer' | 'staff' | 'runner' | 'partner';
  accountStatus?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: HookUser;
};

export type PendingSignup = {
  email: string;
  signupSessionToken: string;
  step: 'verify_email' | 'complete_profile';
};

const KEYS = {
  session: 'hook.auth.session',
  guestSession: 'hook.guest.session',
  onboarding: 'hook.onboarding.complete',
  pendingSignup: 'hook.signup.pending',
};

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
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(KEYS.session);
}

export async function getGuestId() {
  return (await getJson<StoredGuestSession>(KEYS.guestSession))?.guest.publicId || null;
}

export async function ensureGuestId() {
  const existing = await getGuestSession();
  if (existing && new Date(existing.guest.expiresAt) > new Date()) return existing.guest.publicId;
  const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const response = await fetch(`${apiBase}/guest-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ platform: 'unknown' }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.success || !payload?.data?.token) {
    throw new Error(payload?.error?.message || 'Unable to start guest session');
  }
  await saveGuestSession(payload.data);
  return payload.data.guest.publicId as string;
}

export function getGuestSession() {
  return getJson<StoredGuestSession>(KEYS.guestSession);
}

export async function saveGuestSession(session: StoredGuestSession) {
  await setJson(KEYS.guestSession, session);
}

export async function clearGuestId() {
  await SecureStore.deleteItemAsync(KEYS.guestSession);
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
  return (await SecureStore.getItemAsync(KEYS.onboarding)) === 'true';
}

export async function setOnboardingComplete(value = true) {
  await SecureStore.setItemAsync(KEYS.onboarding, value ? 'true' : 'false');
}
