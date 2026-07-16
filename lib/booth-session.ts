import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hook.booth-session.v1';
export type BoothSession = {
  boothSessionToken: string;
  expiresAt: number;
  booth: { id: string; name: string; previewImageUrl?: string; location?: { address?: string } };
};

export async function saveBoothSession(input: Omit<BoothSession, 'expiresAt'> & { expiresInSeconds: number }) {
  const session: BoothSession = { ...input, expiresAt: Date.now() + input.expiresInSeconds * 1000 };
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

export async function getBoothSession() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  const session = JSON.parse(raw) as BoothSession;
  if (!session.boothSessionToken || session.expiresAt <= Date.now()) {
    await AsyncStorage.removeItem(KEY);
    return null;
  }
  return session;
}

export async function clearBoothSession() { await AsyncStorage.removeItem(KEY); }

export async function restoreBoothSession(session: BoothSession | null) {
  if (!session) return clearBoothSession();
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}
