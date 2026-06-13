import { apiClient } from './client';
import type { Product, PaginatedResponse, ProductFilters } from '@/types';

export const productsApi = {
  getAll: async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.append(k, String(v));
    });
    const res = await apiClient.get(`/products?${params}`);
    return res.data.data;
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const res = await apiClient.get(`/products/${slug}`);
    return res.data.data;
  },

  create: async (data: FormData): Promise<Product> => {
    const res = await apiClient.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  update: async (id: string, data: FormData): Promise<Product> => {
    const res = await apiClient.patch(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  deleteImage: async (imageId: string): Promise<void> => {
    await apiClient.delete(`/products/images/${imageId}`);
  },

  setPrimaryImage: async (imageId: string): Promise<void> => {
    await apiClient.patch(`/products/images/${imageId}/primary`);
  },
};
