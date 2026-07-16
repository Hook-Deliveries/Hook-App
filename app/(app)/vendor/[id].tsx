import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LottieLoader } from '@/components/shared/LottieLoader';
import { useVendorQuery } from '@/lib/mobile-api';

interface VendorProduct {
  id: string;
  title: string;
  sellingPrice: number;
  images?: string[];
}

interface VendorDetail {
  id: string;
  businessName: string;
  description?: string;
  imageUrl?: string;
  businessAddress?: string;
  stateName?: string;
  products?: VendorProduct[];
}

function money(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

function ProductTile({ product, index }: { product: VendorProduct; index: number }) {
  return (
    <MotiView
      className="w-[47%]"
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 60 }}>
      <Pressable className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white active:opacity-90">
        <View className="h-32 w-full bg-hook-surface">
          {product.images?.[0] ? (
            <Image source={{ uri: product.images[0] }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="pricetag-outline" size={24} color="#9A9A9A" />
            </View>
          )}
        </View>
        <View className="gap-1 p-2.5">
          <Text numberOfLines={1} className="text-xs font-semibold text-black">
            {product.title}
          </Text>
          <Text className="text-sm font-bold text-black">{money(product.sellingPrice)}</Text>
        </View>
      </Pressable>
    </MotiView>
  );
}

export default function VendorDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendorQuery = useVendorQuery(id);
  const vendor = vendorQuery.data as VendorDetail | undefined;
  const products = vendor?.products ?? [];

  return (
    <View className="flex-1 bg-hook-surface">
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerClassName="pb-16">
        {/* Header image */}
        <View className="h-64 w-full bg-hook-surface">
          {vendor?.imageUrl ? (
            <Image source={{ uri: vendor.imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="storefront-outline" size={40} color="#9A9A9A" />
            </View>
          )}

          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            className="absolute h-10 w-10 items-center justify-center rounded-full bg-white/90"
            style={{ left: 16, top: insets.top + 8 }}>
            <Ionicons name="chevron-back" size={20} color="#111111" />
          </Pressable>
        </View>

        {vendorQuery.isLoading ? (
          <View className="items-center py-16">
            <LottieLoader label="Loading market..." />
          </View>
        ) : !vendor ? (
          <View className="items-center gap-2 py-16">
            <Ionicons name="alert-circle-outline" size={28} color="#9A9A9A" />
            <Text className="text-sm font-medium text-hook-text">This vendor could not be found.</Text>
          </View>
        ) : (
          <>
            <View className="gap-1.5 px-4 pt-5">
              <Text className="text-xl font-bold text-black">{vendor.businessName}</Text>
              {vendor.description ? <Text className="text-sm text-black/65">{vendor.description}</Text> : null}
              {vendor.businessAddress ? (
                <View className="mt-1 flex-row items-center gap-1.5">
                  <Ionicons name="location-outline" size={14} color="#9A9A9A" />
                  <Text numberOfLines={1} className="flex-1 text-xs text-hook-text">
                    {vendor.businessAddress}
                    {vendor.stateName ? `, ${vendor.stateName}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="mt-6 px-4">
              <Text className="mb-3 text-base font-bold text-black">
                Products {products.length > 0 ? `(${products.length})` : ''}
              </Text>

              {products.length === 0 ? (
                <View className="items-center gap-2 rounded-2xl border border-dashed border-black/10 bg-white/60 py-10">
                  <Ionicons name="cube-outline" size={26} color="#9A9A9A" />
                  <Text className="text-sm font-medium text-hook-text">No products listed yet.</Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between gap-y-4">
                  {products.map((product, index) => (
                    <ProductTile key={product.id} product={product} index={index} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
