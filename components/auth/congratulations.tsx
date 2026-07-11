import { router } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import congratsBadge from '@/assets/images/auth/congrats-badge.png';
import congratsGrid from '@/assets/images/auth/congrats-grid.png';

export function Congratulations() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f1f3', overflow: 'hidden' }}>
      {/* Grid background pattern */}
      <Image
        source={congratsGrid}
        resizeMode="contain"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: '18%',
          width: 355,
          height: 213,
        }}
      />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        {/* Badge icon */}
        <Image
          source={congratsBadge}
          resizeMode="contain"
          style={{
            alignSelf: 'center',
            height: 146,
            marginTop: insets.top + 69,
            width: 115,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 7 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        />

        {/* Text */}
        <View
          style={{
            alignItems: 'center',
            gap: 8,
            marginTop: 82,
            paddingHorizontal: 24,
          }}>
          <Text style={{ color: '#000', fontSize: 28, fontWeight: '700', textAlign: 'center' }}>
            Congratulations
          </Text>
          <Text
            style={{
              color: '#414040',
              fontSize: 16,
              maxWidth: 264,
              textAlign: 'center',
              lineHeight: 22,
            }}>
            Your Hook account has been created successfully.
          </Text>

          <Pressable
            accessibilityRole="button"
            style={{
              alignItems: 'center',
              backgroundColor: '#000',
              borderRadius: 50,
              height: 52,
              justifyContent: 'center',
              marginTop: 18,
              width: '100%',
            }}
            onPress={() => router.replace('/(tabs)')}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>continue</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
