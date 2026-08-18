import { apiClient } from './client';
import type { Address } from '@/types';

export interface AddressPayload {
  label: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  landmark?: string;
  isDefault?: boolean;
}

export const addressesApi = {
  getAll: async (): Promise<Address[]> => {
    const res = await apiClient.get('/addresses');
    return res.data.data;
  },

  create: async (data: AddressPayload): Promise<Address> => {
    const res = await apiClient.post('/addresses', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<AddressPayload>): Promise<Address> => {
    const res = await apiClient.patch(`/addresses/${id}`, data);
    return res.data.data;
  },

  setDefault: async (id: string): Promise<Address[]> => {
    const res = await apiClient.patch(`/addresses/${id}/default`);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/addresses/${id}`);
  },
};
