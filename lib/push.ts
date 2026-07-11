import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiRequest } from '@/lib/api';
import { getGuestId, getSession } from '@/lib/session';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(options: { sendWelcome?: boolean } = {}) {
  try {
    if (!Device.isDevice) return null;
    const permission = await Notifications.getPermissionsAsync();
    let status = permission.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const token = await Notifications.getExpoPushTokenAsync();
    const session = await getSession();
    const guestId = await getGuestId();
    if (!session?.accessToken && !guestId) return null;

    await apiRequest('/devices/register', {
      method: 'POST',
      body: JSON.stringify({
        expoPushToken: token.data,
        platform: Platform.OS,
        deviceName: Device.deviceName || Device.modelName || 'Hook device',
        sendWelcome: options.sendWelcome,
      }),
    });
    return token.data;
  } catch {
    return null;
  }
}

export async function unregisterPushToken(expoPushToken?: string) {
  try {
    await apiRequest('/devices/unregister', {
      method: 'POST',
      body: JSON.stringify({ expoPushToken }),
    });
  } catch {
    // best effort
  }
}
