import { apiClient } from './client';
import type { Category } from '@/types';

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories');
    return res.data.data;
  },

  getAllAdmin: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories/admin/all');
    return res.data.data;
  },

  create: async (data: Partial<Category>): Promise<Category> => {
    const res = await apiClient.post('/categories', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    const res = await apiClient.patch(`/categories/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
