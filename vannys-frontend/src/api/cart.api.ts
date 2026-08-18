import { apiClient } from './client';
import type { ServerCart } from '@/types';

/** Ligne du panier local envoyée à la fusion, à la connexion. */
export interface MergeCartItemPayload {
  variantId?: string;
  productId?: string;
  color?: string;
  size?: string;
  quantity: number;
}

const unwrap = (res: { data: { data: ServerCart } }): ServerCart => res.data.data;

export const cartApi = {
  get: () => apiClient.get<{ data: ServerCart }>('/cart').then(unwrap),

  add: (variantId: string, quantity = 1) =>
    apiClient.post<{ data: ServerCart }>('/cart', { variantId, quantity }).then(unwrap),

  merge: (items: MergeCartItemPayload[]) =>
    apiClient.post<{ data: ServerCart }>('/cart/merge', { items }).then(unwrap),

  updateQuantity: (itemId: string, quantity: number) =>
    apiClient.patch<{ data: ServerCart }>(`/cart/${itemId}`, { quantity }).then(unwrap),

  remove: (itemId: string) =>
    apiClient.delete<{ data: ServerCart }>(`/cart/${itemId}`).then(unwrap),

  clear: () => apiClient.delete<{ data: ServerCart }>('/cart').then(unwrap),
};
