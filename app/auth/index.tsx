import { StatusBar } from 'expo-status-bar';

import { AuthStart } from '@/components/auth/auth-start';

export default function AuthScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <AuthStart />
    </>
  );
}
