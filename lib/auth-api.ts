import { useMutation, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import { getSession, type AuthSession } from '@/lib/session';

function compactBody<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export type AuthLookupResponse = {
  email: string;
  exists: boolean;
  nextStep: 'password' | 'create_password' | 'verify_email' | 'complete_profile';
  message: string;
};

export type SignupStartResponse = {
  signupSessionToken: string;
  nextStep: 'verify_email' | 'complete_profile';
};

export type LocalSessionState = {
  session: AuthSession | null;
};

export function lookupEmail(email: string) {
  return apiRequest<AuthLookupResponse>('/auth/lookup', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function startSignup(input: { email: string; password: string }) {
  const body = input;
  return apiRequest<SignupStartResponse>('/auth/signup/start', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(compactBody(body)),
  });
}

export function verifySignup(input: { signupSessionToken: string; code: string }) {
  return apiRequest('/auth/signup/verify', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function resendSignupCode(signupSessionToken: string) {
  return apiRequest('/auth/signup/resend', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ signupSessionToken }),
  });
}

export function completeSignup(input: {
  signupSessionToken: string;
  firstName: string;
  lastName: string;
}) {
  const body = input;
  return apiRequest<AuthSession>('/auth/signup/complete', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(compactBody(body)),
  });
}

export function login(input: { email: string; password: string }) {
  const body = input;
  return apiRequest<AuthSession>('/auth/login', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(compactBody(body)),
  });
}

export function googleLogin(input: { idToken: string }) {
  const body = input;
  return apiRequest<AuthSession>('/auth/google', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(compactBody(body)),
  });
}

export function appleLogin(input: { identityToken: string; firstName?: string; lastName?: string }) {
  return apiRequest<AuthSession>('/auth/apple', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(compactBody(input)),
  });
}

export function forgotPassword(email: string) {
  return apiRequest('/auth/password/forgot', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyPasswordReset(input: { email: string; code: string }) {
  return apiRequest('/auth/password/verify', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function resetPassword(input: { email: string; code: string; password: string }) {
  return apiRequest<AuthSession>('/auth/password/reset', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logout(refreshToken?: string) {
  return apiRequest('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function getProfile() {
  return apiRequest<AuthSession['user']>('/auth/profile');
}

export function updateProfile(input: { firstName: string; lastName: string; phone?: string; avatarUrl?: string }) {
  return apiRequest<AuthSession['user']>('/auth/profile', { method: 'PATCH', body: JSON.stringify(compactBody(input)) });
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return apiRequest('/auth/password/change', { method: 'POST', body: JSON.stringify(input) });
}

export type AccountDevice = { id: string; deviceId?: string; deviceName: string; platform: string; createdAt: string; lastActiveAt: string; current: boolean };
export function listDevices() { return apiRequest<AccountDevice[]>('/devices'); }
export function renameDevice(id: string, deviceName: string) { return apiRequest(`/devices/${id}`, { method: 'PATCH', body: JSON.stringify({ deviceName }) }); }
export function revokeDevice(id: string) { return apiRequest(`/devices/${id}`, { method: 'DELETE' }); }
export function revokeOtherDevices() { return apiRequest('/devices/others', { method: 'DELETE' }); }

export async function getLocalSessionState(): Promise<LocalSessionState> {
  return { session: await getSession() };
}

export function useLookupEmailMutation() {
  return useMutation({ mutationFn: lookupEmail });
}

export function useStartSignupMutation() {
  return useMutation({ mutationFn: startSignup });
}

export function useVerifySignupMutation() {
  return useMutation({ mutationFn: verifySignup });
}

export function useResendSignupCodeMutation() {
  return useMutation({ mutationFn: resendSignupCode });
}

export function useCompleteSignupMutation() {
  return useMutation({ mutationFn: completeSignup });
}

export function useLoginMutation() {
  return useMutation({ mutationFn: login });
}

export function useGoogleLoginMutation() {
  return useMutation({ mutationFn: googleLogin });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: forgotPassword });
}

export function useVerifyPasswordResetMutation() {
  return useMutation({ mutationFn: verifyPasswordReset });
}

export function useResetPasswordMutation() {
  return useMutation({ mutationFn: resetPassword });
}

export function useLogoutMutation() {
  return useMutation({ mutationFn: logout });
}

export function useLocalSessionQuery() {
  return useQuery({
    queryKey: ['auth', 'local-session'],
    queryFn: getLocalSessionState,
  });
}
