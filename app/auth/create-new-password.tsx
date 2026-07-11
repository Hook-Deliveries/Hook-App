import { StatusBar } from 'expo-status-bar';

import { CreateNewPassword } from '@/components/auth/create-new-password';

export default function CreateNewPasswordScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <CreateNewPassword />
    </>
  );
}
