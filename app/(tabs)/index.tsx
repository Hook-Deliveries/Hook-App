import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f1f3' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#000' }}>Welcome to Hook</Text>
      <Text style={{ fontSize: 16, color: '#414040', marginTop: 8 }}>Your marketplace is ready.</Text>
    </View>
  );
}
