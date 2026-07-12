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

const SENSITIVE_KEYS = /^(accessToken|refreshToken|authorization|password|token|idToken|otp|code|signupSessionToken)$/i;

function redactForLog(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactForLog);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEYS.test(key) ? '[REDACTED]' : redactForLog(entry),
    ]),
  );
}

function requestBodyForLog(body: BodyInit | null | undefined): unknown {
  if (!body) return undefined;
  if (typeof body !== 'string') return `[${body.constructor?.name ?? 'Request body'}]`;

  try {
    return redactForLog(JSON.parse(body));
  } catch {
    return body.length > 500 ? `${body.slice(0, 500)}...` : body;
  }
}

function logRequest(method: string, path: string, body: BodyInit | null | undefined) {
  if (!__DEV__) return;
  console.log(`\n[API REQUEST] ${method} ${path}`);
  const payload = requestBodyForLog(body);
  if (payload !== undefined) console.log('[PAYLOAD]', JSON.stringify(payload, null, 2));
}

function logResponse(method: string, path: string, status: number, payload: unknown) {
  if (!__DEV__) return;
  console.log(`\n[API RESPONSE] ${method} ${path} | Status: ${status}`);
  console.log('[RESPONSE DATA]', JSON.stringify(redactForLog(payload), null, 2));
}

function logNetworkError(method: string, path: string, error: unknown) {
  if (!__DEV__) return;
  console.log(`\n[API ERROR] ${method} ${path} | Server unreachable`);
  console.log('[ERROR]', error instanceof Error ? error.message : 'Unknown network error');
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
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
  logRequest(method, path, options.body);
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    logNetworkError(method, path, error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Unable to reach Hook server',
      0,
      error,
    );
  }
  const payload = await response.json().catch(() => null);
  logResponse(method, path, response.status, payload);
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
