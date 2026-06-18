import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';

import { EnterName } from '@/components/auth/enter-name';

export default function EnterNameScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  return (
    <>
      <StatusBar style="dark" />
      <EnterName email={email ?? ''} />
    </>
  );
}
