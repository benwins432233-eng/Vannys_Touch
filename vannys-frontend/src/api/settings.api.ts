import { apiClient } from './client';
import type { ShopSettings, SettingField } from '@/types';

export const settingsApi = {
  /** Réglages publics — aucun jeton requis. */
  get: async (): Promise<ShopSettings> => {
    const res = await apiClient.get('/settings');
    return res.data.data;
  },

  getForAdmin: async (): Promise<{ values: ShopSettings; fields: SettingField[] }> => {
    const res = await apiClient.get('/admin/settings');
    return res.data.data;
  },

  update: async (settings: Partial<ShopSettings>): Promise<ShopSettings> => {
    const res = await apiClient.put('/admin/settings', { settings });
    return res.data.data;
  },
};
