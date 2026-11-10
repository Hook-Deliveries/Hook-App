import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { apiRequest } from '@/lib/api';
import { getDeviceId, getSession } from '@/lib/session';

/**
 * Expo Go dropped remote notifications in SDK 53, and expo-notifications
 * throws the moment it is imported there. This module sits in the import
 * chain of the tab layout, so a top-level import would take the whole app
 * down rather than just disabling push. Loading it lazily keeps Expo Go
 * usable; a real build resolves the module and push works as normal.
 */
type NotificationsModule = typeof import('expo-notifications');

/** Explains, in development only, why push did not register: the causes are otherwise invisible. */
function devNote(message: string) {
  if (__DEV__) console.warn(`[push] ${message}`);
}
let notificationsModule: NotificationsModule | null | undefined;

export function getNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) return notificationsModule;
  try {
    notificationsModule = require('expo-notifications') as NotificationsModule;
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    notificationsModule = null;
    devNote('expo-notifications is not available here. Push needs a development or production build, not Expo Go.');
  }
  return notificationsModule;
}

/**
 * Android 8+ shows notifications only through a channel, and Android 13+ will
 * not even ask for permission until one exists. The backend sends to the
 * channel named 'default'. Safe to call repeatedly.
 */
async function ensureAndroidChannel(Notifications: NotificationsModule) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Hook',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFC809',
  });
  // One channel per group, so each can be muted or changed in the phone's settings.
  const groups: Array<[string, string, string, 'MAX' | 'DEFAULT' | 'LOW']> = [
    ['orders', 'Orders and delivery', 'Updates about your orders, payments and deliveries', 'MAX'],
    ['account', 'Account and security', 'Sign-ins and changes to your account', 'MAX'],
    ['credit', 'Hook credit and referrals', 'Credit earned, spent and referral rewards', 'DEFAULT'],
    ['reminders', 'Reminders', 'Your cart, negotiations and saved items', 'DEFAULT'],
    ['discovery', 'New on Hook', 'New arrivals, markets and offers', 'LOW'],
  ];
  await Promise.all(groups.map(([id, name, description, level]) =>
    Notifications.setNotificationChannelAsync(id, {
      name,
      description,
      importance: Notifications.AndroidImportance[level],
      lightColor: '#FFC809',
    }),
  ));
}

/** The EAS project the token belongs to. Explicit, so it never depends on config being inlined. */
function easProjectId() {
  return (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
    ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
}

// Current permission only — never prompts. For UI that needs to know before asking.
export async function getPushPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined' | 'unavailable'> {
  const Notifications = getNotifications();
  if (!Notifications || !Device.isDevice) return 'unavailable';
  const permission = await Notifications.getPermissionsAsync();
  return permission.status;
}

export async function registerPushToken(options: { sendWelcome?: boolean } = {}) {
  try {
    if (!Device.isDevice) { devNote('Push tokens are only issued to a physical device, not a simulator or emulator.'); return null; }
    const Notifications = getNotifications();
    if (!Notifications) return null;
    await ensureAndroidChannel(Notifications);
    const permission = await Notifications.getPermissionsAsync();
    let status = permission.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') { devNote('Notification permission was not granted. Enable it in the phone settings.'); return null; }

    const projectId = easProjectId();
    if (!projectId) devNote('No EAS projectId found in app.json (extra.eas.projectId); the push token may fail.');
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const session = await getSession();
    if (!session?.accessToken) { devNote('Not signed in yet, so the push token was not registered.'); return null; }

    await apiRequest('/devices/register', {
      method: 'POST',
      body: JSON.stringify({
        expoPushToken: token.data,
        platform: Platform.OS,
        deviceName: Device.deviceName || Device.modelName || 'Hook device',
        deviceId: await getDeviceId(),
        sendWelcome: options.sendWelcome,
      }),
    });
    if (__DEV__) console.info(`[push] Registered ${token.data}`);
    return token.data;
  } catch (error) {
    // Silent for users, but the usual cause on Android (a build without
    // google-services.json) is impossible to find without this line.
    if (__DEV__) console.warn('[push] Could not register for push notifications:', error instanceof Error ? error.message : error);
    return null;
  }
}

type PushTestDevice = {
  platform?: string;
  deviceName?: string;
  ticket: 'accepted' | 'refused' | 'unreachable';
  receipt?: 'delivered' | 'failed' | 'pending';
  error?: string;
  message?: string;
  advice?: string;
};

/**
 * Walks every step push depends on, on this phone, and reports each one in plain words: permission, the Expo token, the
 * registration with Hook's server, and a real test notification with Expo's answer. Nothing else in the app surfaces these
 * failures in a store build, so this is how "push does not work" is traced to its cause.
 */
export async function runPushDiagnostics(): Promise<string> {
  const lines: string[] = [];
  const ok = (text: string) => lines.push(`✓ ${text}`);
  const bad = (text: string) => lines.push(`✗ ${text}`);
  const detail = (error: unknown) => (error instanceof Error ? error.message : String(error));

  lines.push(`${Platform.OS === 'ios' ? 'iPhone' : 'Android'} · ${Device.modelName || 'unknown model'} · v${Constants.expoConfig?.version || '?'}`);
  if (!Device.isDevice) { bad('This is a simulator or emulator. Push only works on a real phone.'); return lines.join('\n'); }
  const Notifications = getNotifications();
  if (!Notifications) { bad('Notifications are not available in this build (Expo Go?).'); return lines.join('\n'); }

  try { await ensureAndroidChannel(Notifications); if (Platform.OS === 'android') ok('Android notification channels created'); } catch (error) { bad(`Notification channel: ${detail(error)}`); }

  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') { bad('Notification permission is off. Turn it on in the phone settings for Hook.'); return lines.join('\n'); }
  ok('Notification permission granted');

  const projectId = easProjectId();
  if (!projectId) { bad('No EAS project id in this build.'); return lines.join('\n'); }
  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    ok('Expo push token created');
  } catch (error) {
    bad(`Could not get a push token: ${detail(error)}`);
    if (Platform.OS === 'android') lines.push('  This usually means the build has no Firebase file (google-services.json).');
    else lines.push('  This usually means the build was signed without the Push Notifications capability.');
    return lines.join('\n');
  }

  // Ask Expo's push service directly, bypassing Hook's server. If this arrives, the phone, the push keys and Expo are all fine
  // and any remaining problem is in how Hook's server registers or sends; if it fails, Expo's own answer says why.
  try {
    const sendResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title: 'Hook direct test', body: 'Sent straight from this phone to Expo.', sound: 'default', channelId: 'default', priority: 'high', data: { type: 'push_test' } }),
    });
    const sent = (await sendResponse.json().catch(() => ({}))) as { data?: { status?: string; id?: string; message?: string; details?: { error?: string } }; errors?: Array<{ message?: string }> };
    const ticket = sent.data;
    if (!sendResponse.ok || !ticket) {
      bad(`Expo refused the direct test (HTTP ${sendResponse.status}): ${sent.errors?.[0]?.message || 'no detail'}`);
      if (sendResponse.status === 401 || sendResponse.status === 403) lines.push("  Enhanced push security is on for this Expo project, so only requests with the project's access token can send. Hook's server needs EXPO_ACCESS_TOKEN.");
    } else if (ticket.status !== 'ok') {
      bad(`Expo rejected the direct test: ${ticket.details?.error || 'error'}${ticket.message ? ` — ${ticket.message}` : ''}`);
    } else {
      ok('Expo accepted a direct test notification');
      let outcome = 'pending';
      for (let attempt = 0; attempt < 4 && outcome === 'pending'; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const receiptResponse = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [ticket.id] }),
        }).catch(() => undefined);
        const receipts = (await receiptResponse?.json().catch(() => ({}))) as { data?: Record<string, { status?: string; message?: string; details?: { error?: string } }> } | undefined;
        const receipt = ticket.id ? receipts?.data?.[ticket.id] : undefined;
        if (!receipt) continue;
        if (receipt.status === 'ok') { outcome = 'delivered'; ok('Delivered to this phone through Google/Apple. You should see it now.'); }
        else {
          outcome = 'failed';
          bad(`Delivery failed: ${receipt.details?.error || 'unknown'}${receipt.message ? ` — ${receipt.message}` : ''}`);
          if (receipt.details?.error === 'InvalidCredentials') lines.push(Platform.OS === 'ios' ? '  Expo has no valid Apple push key (APNs) for this app. Add it with: eas credentials -p ios.' : '  Expo has no valid Firebase (FCM v1) key for this app. Add it with: eas credentials -p android.');
          if (receipt.details?.error === 'MismatchSenderId') lines.push('  The uploaded Firebase key belongs to a different project than this build\'s google-services.json.');
        }
      }
      if (outcome === 'pending') lines.push('  Expo has not reported delivery yet; check again in a minute.');
    }
  } catch (error) {
    bad(`Could not reach Expo: ${detail(error)}`);
  }

  const session = await getSession();
  if (!session?.accessToken) { bad('Not signed in, so the token cannot be registered.'); return lines.join('\n'); }
  try {
    await apiRequest('/devices/register', {
      method: 'POST',
      body: JSON.stringify({ expoPushToken: token, platform: Platform.OS, deviceName: Device.deviceName || Device.modelName || 'Hook device', deviceId: await getDeviceId() }),
    });
    ok('Registered with Hook');
  } catch (error) {
    bad(`Hook refused the registration: ${detail(error)}`);
    return lines.join('\n');
  }

  try {
    const result = await apiRequest<{ pushEnabled: boolean; devices: PushTestDevice[] }>('/devices/test-push', { method: 'POST', body: JSON.stringify({}) });
    if (!result.pushEnabled) { bad('Push is switched off on the server (PUSH_ENABLED=false).'); return lines.join('\n'); }
    if (!result.devices.length) { bad('The server has no active device for this account.'); return lines.join('\n'); }
    for (const device of result.devices) {
      const name = `${device.platform || '?'} · ${device.deviceName || 'device'}`;
      if (device.ticket === 'accepted' && device.receipt === 'delivered') ok(`Test sent to ${name} and delivered. It should be on screen now.`);
      else if (device.ticket === 'accepted') ok(`Test sent to ${name}. Expo accepted it; delivery is still pending.`);
      else bad(`${name}: ${device.error || device.ticket}${device.message ? ` — ${device.message}` : ''}`);
      if (device.receipt === 'failed') bad(`${name}: delivery failed (${device.error || 'unknown'})${device.message ? ` — ${device.message}` : ''}`);
      if (device.advice) lines.push(`  ${device.advice}`);
    }
  } catch (error) {
    bad(`Test notification request failed: ${detail(error)}`);
  }
  return lines.join('\n');
}

export async function unregisterPushToken(expoPushToken?: string) {
  try {
    let token = expoPushToken;
    const Notifications = getNotifications();
    if (!token && Device.isDevice && Notifications) {
      const permission = await Notifications.getPermissionsAsync();
      if (permission.status === 'granted') token = (await Notifications.getExpoPushTokenAsync()).data;
    }
    if (!token) return;
    await apiRequest('/devices/unregister', {
      method: 'POST',
      body: JSON.stringify({ expoPushToken: token }),
    });
  } catch {
    // best effort
  }
}
