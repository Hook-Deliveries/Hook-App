import { getGuestId, getSession, saveSession, type AuthSession } from '@/lib/session';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly data?: unknown,
  ) {
    super(message);
  }
}

type ApiOptions = RequestInit & {
  auth?: boolean;
  guest?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (options.auth !== false) {
    const session = await getSession();
    if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  if (options.guest !== false) {
    const guestId = await getGuestId();
    if (guestId) headers.set('X-Guest-Id', guestId);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : 'Unable to reach Hook server',
      0,
      error,
    );
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || 'Request failed', response.status, payload);
  }
  return payload?.data as T;
}

export async function refreshSession(session: AuthSession) {
  if (!session.refreshToken) return null;
  try {
    const data = await apiRequest<AuthSession>('/auth/refresh', {
      auth: false,
      guest: false,
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    await saveSession(data);
    return data;
  } catch {
    return null;
  }
}

export { API_BASE_URL };
