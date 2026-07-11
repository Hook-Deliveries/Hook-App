import { StatusBar } from 'expo-status-bar';

import { PasswordLogin } from '@/components/auth/password-login';

export default function PasswordScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <PasswordLogin />
    </>
  );
}
