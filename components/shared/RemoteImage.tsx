import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageContentFit } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type RemoteImageProps = {
  uri?: string | null;
  contentFit?: ImageContentFit;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  transition?: number;
};

export function RemoteImage({ uri, contentFit = 'cover', fallbackIcon = 'image-outline', transition = 180 }: RemoteImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-[#f1f1f3]"><Ionicons name={fallbackIcon} size={28} color="#a1a1aa" /></View>;
  }

  return <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit={contentFit} cachePolicy="memory-disk" transition={transition} onError={() => setFailed(true)} />;
}
