import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LocationScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f1f3',
        paddingHorizontal: 36,
        paddingTop: insets.top,
      }}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#FFF4C7',
          borderRadius: 44,
          height: 88,
          justifyContent: 'center',
          width: 88,
        }}>
        <Ionicons name="location-outline" size={40} color="#111" />
      </View>
      <Text style={{ color: '#000', fontSize: 20, fontWeight: '800', marginTop: 20 }}>Location</Text>
      <Text style={{ color: '#696969', fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' }}>
        Nearby booths and delivery coverage are coming soon.
      </Text>
    </View>
  );
}
