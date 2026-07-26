import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface PublicCatalogMedia {
  type: 'image';
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface PublicCatalogProduct {
  publicId: string;
  title: string;
  slug: string;
  description?: string;
  media: PublicCatalogMedia[];
  sourceState: { publicId: string; name: string; code: string } | null;
  market: { publicId: string; name: string } | null;
  category: { publicId: string; name: string; slug: string; iconUrl?: string } | null;
  variants: Array<{ publicId: string; size?: string; colour?: string; attributes: Record<string, string> }>;
  currency: string;
  sellingPriceMinor: number;
  effectivePriceMinor: number;
  discountMinor: number;
  negotiationAvailable: boolean;
  availabilityStatus: string;
  availabilityNote?: string;
  publishedAt: string;
}

export interface PublicCategory {
  publicId: string;
  name: string;
  slug: string;
  iconUrl?: string;
  description?: string;
}

export interface PublicProductPage {
  data: PublicCatalogProduct[];
  nextCursor: string | null;
  hasMore: boolean;
}

function toQueryString(params?: QueryParams) {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

function post<TData, TVariables>(path: string, variables?: TVariables) {
  return apiRequest<TData>(path, {
    method: 'POST',
    body: variables ? JSON.stringify(variables) : undefined,
  });
}

function patch<TData, TVariables>(path: string, variables?: TVariables) {
  return apiRequest<TData>(path, {
    method: 'PATCH',
    body: variables ? JSON.stringify(variables) : undefined,
  });
}

function remove<TData>(path: string) {
  return apiRequest<TData>(path, { method: 'DELETE' });
}

export const mobileQueryKeys = {
  feed: () => ['mobile', 'feed'] as const,
  search: (params?: QueryParams) => ['mobile', 'search', params ?? {}] as const,
  products: (params?: QueryParams) => ['mobile', 'products', params ?? {}] as const,
  product: (id: string) => ['mobile', 'products', id] as const,
  categories: () => ['mobile', 'categories'] as const,
  cart: () => ['mobile', 'cart'] as const,
  orders: (params?: QueryParams) => ['mobile', 'orders', params ?? {}] as const,
  order: (id: string) => ['mobile', 'orders', id] as const,
  negotiations: (params?: QueryParams) => ['mobile', 'negotiations', params ?? {}] as const,
  negotiation: (id: string) => ['mobile', 'negotiations', id] as const,
  paymentStatus: (orderId: string) => ['mobile', 'payments', orderId, 'status'] as const,
  notifications: () => ['mobile', 'notifications'] as const,
  notification: (id: string) => ['mobile', 'notifications', id] as const,
};

export function useHomeFeedQuery() {
  return useQuery({
    queryKey: mobileQueryKeys.feed(),
    queryFn: () => apiRequest('/public/home', { auth: false }),
  });
}

export function useSearchQuery(params?: QueryParams) {
  return useQuery({
    queryKey: mobileQueryKeys.search(params),
    queryFn: () => apiRequest<PublicProductPage>(`/public/search${toQueryString(params)}`, { auth: false }),
  });
}

export function useProductsQuery(params?: QueryParams) {
  return useQuery({
    queryKey: mobileQueryKeys.products(params),
    queryFn: () => apiRequest<PublicProductPage>(`/public/products${toQueryString(params)}`, { auth: false }),
  });
}

export function useProductQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: mobileQueryKeys.product(id || ''),
    queryFn: () => apiRequest<PublicCatalogProduct>(`/public/products/${id}`, { auth: false }),
  });
}

export function useOperatingStatesQuery() {
  return useQuery({
    queryKey: ['mobile', 'operating-states'],
    queryFn: () => apiRequest('/public/states', { auth: false }),
  });
}

export function useOperationCitiesQuery(stateId?: string) {
  return useQuery({
    enabled: Boolean(stateId),
    queryKey: ['mobile', 'public', 'cities', stateId],
    queryFn: () => apiRequest(`/public/cities${toQueryString({ stateId })}`, { auth: false }),
  });
}

export function useServiceZonesQuery(stateId?: string, cityId?: string) {
  return useQuery({
    enabled: Boolean(stateId),
    queryKey: ['mobile', 'public', 'zones', stateId, cityId],
    queryFn: () => apiRequest(`/public/zones${toQueryString({ stateId, cityId })}`, { auth: false }),
  });
}

export function useMarketsQuery(stateId?: string, cityId?: string) {
  return useQuery({
    enabled: Boolean(stateId),
    queryKey: ['mobile', 'public', 'markets', stateId, cityId],
    queryFn: () => apiRequest(`/public/markets${toQueryString({ stateId, cityId })}`, { auth: false }),
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: mobileQueryKeys.categories(),
    queryFn: () => apiRequest<PublicCategory[]>('/public/categories', { auth: false }),
  });
}

export function useCartQuery() {
  return useQuery({
    queryKey: mobileQueryKeys.cart(),
    queryFn: () => apiRequest('/cart'),
  });
}

export function useAddCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      productId: string;
      quantity: number;
      selectedVariants?: { color?: string; size?: string };
    }) => post('/cart/items', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mobileQueryKeys.cart() }),
  });
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; quantity: number }) =>
      patch(`/cart/items/${input.itemId}`, { quantity: input.quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mobileQueryKeys.cart() }),
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => remove(`/cart/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mobileQueryKeys.cart() }),
  });
}

export function useClearCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => remove('/cart'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mobileQueryKeys.cart() }),
  });
}

export function useCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      guestEmail?: string;
      guestName?: string;
      deliveryAddress: {
        street: string;
        city: string;
        state: string;
        landmark?: string;
        coordinates?: { lat: number; lng: number };
        phone: string;
      };
      deliveryNotes?: string;
      scheduledDeliveryAt?: string;
      paymentMode?: 'pay_now' | 'pay_on_delivery';
      orderType?: 'standard' | 'gift';
      giftRecipient?: { name: string; email: string; phone: string; address: { street: string; city: string; state: string; landmark?: string; phone: string }; message?: string };
    }) => post('/checkout', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mobileQueryKeys.cart() });
      queryClient.invalidateQueries({ queryKey: ['mobile', 'orders'] });
    },
  });
}

export function useOrdersQuery(params?: QueryParams) {
  return useQuery({
    queryKey: mobileQueryKeys.orders(params),
    queryFn: () => apiRequest(`/orders${toQueryString(params)}`),
  });
}

export function useOrderQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: mobileQueryKeys.order(id || ''),
    queryFn: () => apiRequest(`/orders/${id}`),
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { orderId: string; reason?: string }) =>
      post(`/orders/${input.orderId}/cancel`, { reason: input.reason }),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['mobile', 'orders'] });
      queryClient.invalidateQueries({ queryKey: mobileQueryKeys.order(input.orderId) });
    },
  });
}

export function useNegotiationsQuery(params?: QueryParams) {
  return useQuery({
    queryKey: mobileQueryKeys.negotiations(params),
    queryFn: () => apiRequest(`/negotiations${toQueryString(params)}`),
  });
}

export function useNegotiationQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: mobileQueryKeys.negotiation(id || ''),
    queryFn: () => apiRequest(`/negotiations/${id}`),
  });
}

export function useStartNegotiationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; offeredPrice: number; message?: string }) =>
      post('/negotiations', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mobile', 'negotiations'] }),
  });
}

export function useCounterNegotiationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { negotiationId: string; offeredPrice: number; message?: string }) =>
      post(`/negotiations/${input.negotiationId}/counter`, {
        offeredPrice: input.offeredPrice,
        message: input.message,
      }),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['mobile', 'negotiations'] });
      queryClient.invalidateQueries({ queryKey: mobileQueryKeys.negotiation(input.negotiationId) });
    },
  });
}

export function useAcceptNegotiationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (negotiationId: string) => post(`/negotiations/${negotiationId}/accept`),
    onSuccess: (_data, negotiationId) => {
      queryClient.invalidateQueries({ queryKey: ['mobile', 'negotiations'] });
      queryClient.invalidateQueries({ queryKey: mobileQueryKeys.negotiation(negotiationId) });
      queryClient.invalidateQueries({ queryKey: mobileQueryKeys.cart() });
    },
  });
}

export function useInitializePaymentMutation() {
  return useMutation({
    mutationFn: (input: {
      orderId: string;
      gateway?: 'opay';
      paymentMethod?: 'card' | 'bank_transfer' | 'ussd';
    }) =>
      post('/payments/initialize', input),
  });
}

export function useVerifyPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) => post(`/payments/verify/${reference}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mobile', 'payments'] }),
  });
}

export function usePaymentStatusQuery(orderId?: string) {
  return useQuery({
    enabled: Boolean(orderId),
    queryKey: mobileQueryKeys.paymentStatus(orderId || ''),
    queryFn: () => apiRequest(`/payments/orders/${orderId}/status`),
  });
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: mobileQueryKeys.notifications(),
    queryFn: () => apiRequest('/notifications'),
  });
}

export function useNotificationQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: mobileQueryKeys.notification(id || ''),
    queryFn: () => apiRequest(`/notifications/${id}`),
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => patch(`/notifications/${notificationId}/read`),
    onSuccess: (_data, notificationId) => {
      queryClient.invalidateQueries({ queryKey: mobileQueryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: mobileQueryKeys.notification(notificationId) });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mobileQueryKeys.notifications() }),
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => remove(`/notifications/${notificationId}`),
    onSuccess: (_data, notificationId) => {
      queryClient.invalidateQueries({ queryKey: mobileQueryKeys.notifications() });
      queryClient.removeQueries({ queryKey: mobileQueryKeys.notification(notificationId) });
    },
  });
}

export function useClearNotificationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => remove('/notifications/clear'),
    onSuccess: () => {
      queryClient.setQueryData(mobileQueryKeys.notifications(), { data: [], unread: 0, total: 0 });
      queryClient.invalidateQueries({ queryKey: mobileQueryKeys.notifications() });
    },
  });
}
