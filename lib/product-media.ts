/**
 * A product's photos are shown in the order the backend gives them: the gallery arranged at review, first photo =
 * primary. The backend also sends each photo's `position`, so everything here sorts by that instead of trusting
 * array order, and falls back to array order for older responses that have no position.
 */
export type MediaLike = { url?: string | null; type?: string; position?: number };

export function orderedMedia<T extends MediaLike>(media?: readonly T[] | null): T[] {
  return (media || [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.position ?? a.index) - (b.item.position ?? b.index) || a.index - b.index)
    .map(({ item }) => item);
}

/** The first photo, i.e. the one shown on cards, in the cart and as the product's primary image. */
export function primaryImageUrl(product?: { media?: readonly MediaLike[] | null } | null): string | undefined {
  const first = orderedMedia(product?.media).find((item) => (!item.type || item.type === "image") && item.url);
  return first?.url || undefined;
}
