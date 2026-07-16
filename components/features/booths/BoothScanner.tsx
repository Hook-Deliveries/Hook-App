import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { HookLoader } from '@/components/shared/HookLoader';
import { toast } from '@/components/shared/toast';
import { parseBoothQr, type BoothQrCredential } from '@/lib/booth-qr';

export function BoothScanner({ busy, onScan, onUseCode }: { busy: boolean; onScan: (credential: BoothQrCredential) => void; onUseCode: () => void }) {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string>();
  const [torch, setTorch] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const scanLocked = useRef(false);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFocused) scanLocked.current = false;
    return () => { scanLocked.current = true; if (unlockTimer.current) clearTimeout(unlockTimer.current); };
  }, [isFocused]);

  function retry() {
    setCameraError(undefined);
    setCameraReady(false);
    scanLocked.current = false;
    setCameraKey((value) => value + 1);
  }

  function scan(value: string) {
    if (scanLocked.current || busy) return;
    const credential = parseBoothQr(value);
    if (!credential) {
      scanLocked.current = true;
      toast.error('Not a Hook booth QR', 'Point your camera at the QR displayed by the booth.');
      unlockTimer.current = setTimeout(() => { scanLocked.current = false; }, 1400);
      return;
    }
    scanLocked.current = true;
    onScan(credential);
  }

  if (!Device.isDevice) return <CameraFallback icon="phone-portrait-outline" title="Use a physical device" message="The iOS simulator does not provide a camera. Open Hook on your phone or enter the booth code." action="Enter code" onPress={onUseCode} />;
  if (!permission) return <View className="h-[390px] items-center justify-center rounded-[20px] bg-[#111]"><HookLoader variant="yellow" label="Checking camera" /></View>;
  if (!permission.granted) return <CameraFallback icon="camera-outline" title="Camera access is off" message="Allow camera access to scan official Hook booth QR codes." action={permission.canAskAgain ? 'Allow camera' : 'Open settings'} onPress={() => void (permission.canAskAgain ? requestPermission() : Linking.openSettings())} secondary={onUseCode} />;
  if (cameraError) return <CameraFallback icon="warning-outline" title="Camera unavailable" message={cameraError} action="Try again" onPress={retry} secondary={onUseCode} />;

  return <View className="h-[390px] overflow-hidden rounded-[20px] bg-[#111]">
    <CameraView
      key={cameraKey}
      active={isFocused}
      facing="back"
      enableTorch={torch}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onCameraReady={() => setCameraReady(true)}
      onMountError={(event) => setCameraError(event.message || 'Hook could not start the device camera.')}
      onBarcodeScanned={isFocused && !busy ? ({ data }) => scan(data) : undefined}
      className="flex-1">
      <View className="flex-1 items-center justify-center bg-black/10"><View className="h-56 w-56 rounded-[28px] border-2 border-hook" /></View>
      <Pressable onPress={() => setTorch((value) => !value)} className="absolute right-4 top-4 h-11 w-11 items-center justify-center rounded-full bg-black/60" accessibilityLabel={torch ? 'Turn flash off' : 'Turn flash on'}><Ionicons name={torch ? 'flash' : 'flash-outline'} size={20} color={torch ? '#FFC809' : '#fff'} /></Pressable>
    </CameraView>
    {!cameraReady || busy ? <View className="absolute inset-0 items-center justify-center bg-black/60"><HookLoader variant="yellow" /><Text className="mt-3 text-sm font-semibold text-white">{busy ? 'Opening booth...' : 'Starting camera...'}</Text></View> : null}
  </View>;
}

function CameraFallback({ icon, title, message, action, onPress, secondary }: { icon: keyof typeof Ionicons.glyphMap; title: string; message: string; action: string; onPress: () => void; secondary?: () => void }) {
  return <View className="h-[390px] items-center justify-center rounded-[20px] bg-[#111] px-8"><View className="h-16 w-16 items-center justify-center rounded-full bg-hook"><Ionicons name={icon} size={28} color="#111" /></View><Text className="mt-5 text-center text-lg font-black text-white">{title}</Text><Text className="mt-2 text-center text-sm leading-5 text-white/60">{message}</Text><Pressable onPress={onPress} className="mt-5 rounded-full bg-white px-6 py-3"><Text className="font-bold text-black">{action}</Text></Pressable>{secondary ? <Pressable onPress={secondary} className="mt-3 px-4 py-2"><Text className="font-semibold text-hook">Enter code instead</Text></Pressable> : null}</View>;
}
