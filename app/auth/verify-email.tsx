import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';

import { VerifyEmail } from '@/components/auth/verify-email';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  return (
    <>
      <StatusBar style="dark" />
      <VerifyEmail email={email ?? ''} />
    </>
  );
}
