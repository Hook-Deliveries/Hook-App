import { StatusBar } from 'expo-status-bar';

import { Congratulations } from '@/components/auth/congratulations';

export default function CongratulationsScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <Congratulations />
    </>
  );
}
