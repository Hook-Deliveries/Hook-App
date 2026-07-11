import { StatusBar } from 'expo-status-bar';

import { ResetCode } from '@/components/auth/reset-code';

export default function ResetCodeScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <ResetCode />
    </>
  );
}
