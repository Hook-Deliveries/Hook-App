import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import bellIcon from '@/assets/images/notification/bell.png';
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/lib/mobile-api';

type HookNotification = {
  id: string;
  title: string;
  body: string;
  isRead?: boolean;
  createdAt?: string;
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const notifications = useNotificationsQuery();
  const markRead = useMarkNotificationReadMutation();
  const rows = ((notifications.data as any)?.data || []) as HookNotification[];

  async function handleNotificationPress(item: HookNotification) {
    if (!item.isRead) await markRead.mutateAsync(item.id);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f1f3', paddingTop: insets.top + 14 }}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          paddingHorizontal: 18,
          position: 'relative',
        }}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 22,
            height: 44,
            justifyContent: 'center',
            left: 18,
            position: 'absolute',
            width: 44,
          }}>
          <Ionicons name="chevron-back" size={20} color="#111" />
        </Pressable>
        <Text style={{ color: '#000', fontSize: 18, fontWeight: '700' }}>Notification</Text>
      </View>

      {notifications.isLoading ? (
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <Text style={{ color: '#414040', fontSize: 14 }}>Loading notifications...</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 40 }}>
          <View
            style={{
              alignItems: 'center',
              backgroundColor: '#F8E9A7',
              borderRadius: 44,
              height: 88,
              justifyContent: 'center',
              width: 88,
            }}>
            <Image source={bellIcon} resizeMode="contain" style={{ height: 62, width: 62 }} />
          </View>
          <Text
            style={{
              color: '#696969',
              fontSize: 14,
              lineHeight: 18,
              marginTop: 18,
              maxWidth: 220,
              textAlign: 'center',
            }}>
            All your notification will show on this page
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 18, paddingTop: 36 }}
          showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12 }}>
            {rows.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => handleNotificationPress(item)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 18,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
                  <View
                    style={{
                      backgroundColor: item.isRead ? '#f1f1f3' : '#FFF4C7',
                      borderRadius: 18,
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Image source={bellIcon} resizeMode="contain" style={{ height: 24, width: 24 }} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: '#000', fontSize: 15, fontWeight: '700' }}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={2} style={{ color: '#414040', fontSize: 13, lineHeight: 18, marginTop: 3 }}>
                      {item.body}
                    </Text>
                  </View>
                  {!item.isRead ? <View style={{ backgroundColor: '#FFC809', borderRadius: 5, height: 10, width: 10 }} /> : null}
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
