import AsyncStorage from "@react-native-async-storage/async-storage";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { PublicCatalogProduct } from "@/lib/mobile-api";

const KEY = "hook.recently-viewed.v1";
const MAX = 12;
const listeners = new Set<(items: PublicCatalogProduct[]) => void>();
let cache: PublicCatalogProduct[] | null = null;

async function load(): Promise<PublicCatalogProduct[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as PublicCatalogProduct[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

/** Remember a product the customer opened, most recent first. */
export async function rememberViewedProduct(product: PublicCatalogProduct) {
  // A product that cannot be bought right now (out of stock, taken down) has no place on the shelf.
  if (product.isPurchasable === false) return;
  const current = await load();
  cache = [product, ...current.filter((item) => item.publicId !== product.publicId)].slice(0, MAX);
  for (const listener of listeners) listener(cache);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Recently viewed is a convenience; failing to save it must never surface.
  }
}

/**
 * Recently viewed products, optionally leaving one out (the product being viewed).
 *
 * The list is remembered on the phone, so what it holds can go stale: a vendor marks a product out of stock, or it is
 * taken down. Each shelf is checked against the server, and only products a customer can buy right now are shown, with
 * their current price and photos. The check sits under the ["mobile", "products"] query key, which the app refreshes
 * the moment the server announces a catalogue change, so a product that sells out leaves the shelf straight away.
 */
export function useRecentlyViewed(excludeId?: string) {
  const [stored, setStored] = useState<PublicCatalogProduct[]>([]);
  const ids = stored.map((item) => item.publicId);
  const live = useQuery({
    queryKey: ["mobile", "products", "recently-viewed", ids.join(",")],
    enabled: ids.length > 0,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: () => apiRequest<PublicCatalogProduct[]>(`/public/products/status?ids=${encodeURIComponent(ids.join(","))}`, { auth: false }),
  });
  const items = useMemo(() => {
    // Offline or the check failed: show what was saved rather than an empty shelf. Until the first answer, show nothing,
    // so a sold-out product never flashes up first.
    if (live.isError) return stored;
    if (!live.data) return [];
    const current = new Map(live.data.map((product) => [product.publicId, product]));
    return stored.flatMap((item) => {
      const fresh = current.get(item.publicId);
      return fresh && fresh.isPurchasable !== false ? [fresh] : [];
    });
  }, [stored, live.data, live.isError]);
  useEffect(() => {
    let alive = true;
    void load().then((value) => alive && setStored(value));
    const listener = (value: PublicCatalogProduct[]) => alive && setStored(value);
    listeners.add(listener);
    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, []);
  const clear = useCallback(async () => {
    cache = [];
    setStored([]);
    await AsyncStorage.removeItem(KEY).catch(() => undefined);
  }, []);
  return { items: excludeId ? items.filter((item) => item.publicId !== excludeId) : items, clear };
}
