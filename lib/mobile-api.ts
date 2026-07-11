import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

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
  vendors: (params?: QueryParams) => ['mobile', 'vendors', params ?? {}] as const,
  vendor: (id: string) => ['mobile', 'vendors', id] as const,
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
    queryFn: () => apiRequest('/feed', { auth: false }),
  });
}

export function useSearchQuery(params?: QueryParams) {
  return useQuery({
    queryKey: mobileQueryKeys.search(params),
    queryFn: () => apiRequest(`/search${toQueryString(params)}`, { auth: false }),
  });
}

export function useSearchSuggestionsQuery(params?: QueryParams) {
  return useQuery({
    queryKey: ['mobile', 'search-suggestions', params ?? {}],
    queryFn: () => apiRequest(`/search/suggestions${toQueryString(params)}`, { auth: false }),
  });
}

export function useProductsQuery(params?: QueryParams) {
  return useQuery({
    queryKey: mobileQueryKeys.products(params),
    queryFn: () => apiRequest(`/products${toQueryString(params)}`, { auth: false }),
  });
}

export function useProductQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: mobileQueryKeys.product(id || ''),
    queryFn: () => apiRequest(`/products/${id}`, { auth: false }),
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: mobileQueryKeys.categories(),
    queryFn: () => apiRequest('/categories', { auth: false }),
  });
}

export function useCategoryTreeQuery() {
  return useQuery({
    queryKey: ['mobile', 'categories', 'tree'],
    queryFn: () => apiRequest('/categories/tree', { auth: false }),
  });
}

export function useVendorsQuery(params?: QueryParams) {
  return useQuery({
    queryKey: mobileQueryKeys.vendors(params),
    queryFn: () => apiRequest(`/vendors${toQueryString(params)}`, { auth: false }),
  });
}

export function useVendorQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: mobileQueryKeys.vendor(id || ''),
    queryFn: () => apiRequest(`/vendors/${id}`, { auth: false }),
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
    mutationFn: (input: {
      productId: string;
      quantity: number;
      selectedVariants?: { color?: string; size?: string };
    }) =>
      post('/cart/items', input),
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
    mutationFn: (input: {
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
      gateway?: 'paystack' | 'nomba';
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
