import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { toast } from '@/components/shared/toast';
import { promptScheduledDeletion, scheduledDeletionDate } from '@/lib/account-deletion-api';
import { appleLogin } from '@/lib/auth-api';
import { completeSignIn } from '@/lib/post-sign-in';
import { ApiError } from '@/lib/api';
import { isTemporarilyUnavailable, retryOnUnavailable } from '@/lib/sign-in-retry';

export function useHookAppleAuth() {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  async function signInWithApple() {
    if (!available || loading) return false;
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Apple did not return an identity token');
      // Apple only hands over the name on the very first sign-in, so the token and name are kept for the retry.
      const session = await retryOnUnavailable(() => appleLogin({
        identityToken: credential.identityToken!,
        firstName: credential.fullName?.givenName || undefined,
        lastName: credential.fullName?.familyName || undefined,
      }));
      await completeSignIn(session);
      toast.success('Welcome to Hook', 'Apple sign-in completed.');
      return true;
    } catch (error) {
      const deletionDate = scheduledDeletionDate(error);
      if (deletionDate) {
        promptScheduledDeletion(deletionDate, {});
        return false;
      }
      const code = (error as { code?: string }).code;
      if (code === 'ERR_REQUEST_CANCELED') return false;
      if (isTemporarilyUnavailable(error)) {
        toast.error('Apple sign-in is busy', 'Please try again in a moment, or continue with email.');
      } else if (error instanceof ApiError && error.status === 401) {
        toast.error('Apple sign-in could not be verified', 'Please try again or use email sign-in.');
      } else if (code && code.startsWith('ERR_')) {
        // Apple's own dialog failed (not signed in to iCloud, no network, ...).
        toast.error('Apple sign-in failed', 'Check that you are signed in to Apple on this device, then try again.');
      } else {
        toast.error('Apple sign-in failed', error instanceof Error ? error.message : 'Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { isAppleReady: available, isAppleLoading: loading, signInWithApple };
}
