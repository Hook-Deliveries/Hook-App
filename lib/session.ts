import * as SecureStore from 'expo-secure-store';

export type HookUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: string;
  isEmailVerified?: boolean;
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
  guestId: 'hook.guest.id',
  onboarding: 'hook.onboarding.complete',
  pendingSignup: 'hook.signup.pending',
};

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

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
  return SecureStore.getItemAsync(KEYS.guestId);
}

export async function ensureGuestId() {
  const existing = await getGuestId();
  if (existing) return existing;
  const guestId = randomId('guest');
  await SecureStore.setItemAsync(KEYS.guestId, guestId);
  return guestId;
}

export async function clearGuestId() {
  await SecureStore.deleteItemAsync(KEYS.guestId);
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
