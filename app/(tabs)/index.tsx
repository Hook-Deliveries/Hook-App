import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import bellIcon from '@/assets/images/notification/bell.png';
import { useNotificationsQuery } from '@/lib/mobile-api';

export default function HomeScreen() {
  const notifications = useNotificationsQuery();
  const unread = Number((notifications.data as any)?.unread || 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f1f3', paddingHorizontal: 20, paddingTop: 64 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: '#000', fontSize: 24, fontWeight: '700' }}>Welcome to Hook</Text>
          <Text style={{ color: '#414040', fontSize: 16, marginTop: 8 }}>Your marketplace is ready.</Text>
        </View>
        <Pressable
          accessibilityLabel="Open notifications"
          accessibilityRole="button"
          onPress={() => router.push('/notifications')}
          style={{
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 24,
            height: 48,
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            width: 48,
          }}>
          <Image source={bellIcon} resizeMode="contain" style={{ height: 27, width: 27 }} />
          {unread > 0 ? (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: '#FF3B30',
                borderColor: '#fff',
                borderRadius: 9,
                borderWidth: 2,
                height: 18,
                justifyContent: 'center',
                position: 'absolute',
                right: 3,
                top: 3,
                minWidth: 18,
              }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                {unread > 9 ? '9+' : unread}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Ionicons name="storefront-outline" size={42} color="#111" />
        <Text style={{ color: '#000', fontSize: 20, fontWeight: '700', marginTop: 14 }}>Start exploring</Text>
        <Text style={{ color: '#414040', fontSize: 14, lineHeight: 20, marginTop: 6, textAlign: 'center' }}>
          Products, offers, and order updates will live here as the marketplace grows.
        </Text>
      </View>
    </View>
  );
}
