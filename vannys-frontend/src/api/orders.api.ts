import { apiClient } from './client';
import type { Order, PaginatedResponse, OrderStatus } from '@/types';

export interface CreateOrderPayload {
  notes?: string;
  deliveryFullName: string;
  deliveryPhone: string;
  deliveryCity: string;
  deliveryDistrict: string;
  deliveryAddress: string;
  deliveryLandmark?: string;
  /**
   * Le contenu de la commande vient du panier serveur depuis le lot L3 : le
   * client n'envoie plus de lignes. Le champ reste dans le type pour les
   * appelants qui n'ont pas encore migré.
   * @deprecated
   */
  items?: Array<{
    productId: string;
    quantity: number;
    color?: string;
    size?: string;
  }>;
}

export const ordersApi = {
  getMyOrders: async (page = 1, limit = 10): Promise<PaginatedResponse<Order>> => {
    const res = await apiClient.get(`/orders/my?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  getById: async (id: string): Promise<Order> => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data.data;
  },

  create: async (data: CreateOrderPayload): Promise<Order> => {
    const res = await apiClient.post('/orders', data);
    return res.data.data;
  },

  cancel: async (id: string, comment?: string): Promise<Order> => {
    const res = await apiClient.post(`/orders/${id}/cancel`, { comment });
    return res.data.data;
  },

  // Admin
  getAll: async (params?: {
    status?: OrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.append(k, String(v));
      });
    }
    const res = await apiClient.get(`/orders/admin/all?${query}`);
    return res.data.data;
  },

  getStats: async () => {
    const res = await apiClient.get('/orders/admin/stats');
    return res.data.data;
  },

  /** Détail admin : lignes, historique et transitions autorisées. */
  getByIdForAdmin: async (id: string): Promise<Order> => {
    const res = await apiClient.get(`/orders/admin/${id}`);
    return res.data.data;
  },

  updateStatus: async (
    id: string,
    data: { status: OrderStatus; trackingNumber?: string; comment?: string },
  ): Promise<Order> => {
    const res = await apiClient.patch(`/orders/admin/${id}/status`, data);
    return res.data.data;
  },
};
