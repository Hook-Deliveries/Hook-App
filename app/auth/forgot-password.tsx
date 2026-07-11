import { StatusBar } from 'expo-status-bar';

import { ForgotPassword } from '@/components/auth/forgot-password';

export default function ForgotPasswordScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <ForgotPassword />
    </>
  );
}
