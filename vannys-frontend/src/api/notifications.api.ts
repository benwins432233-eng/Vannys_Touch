import { apiClient } from './client';
import type { NotificationFeed } from '@/types';

/** Abonnement push tel que le navigateur le fournit, prêt pour le serveur. */
export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

export const notificationsApi = {
  list: async (page = 1): Promise<NotificationFeed> => {
    const res = await apiClient.get(`/notifications?page=${page}`);
    return res.data.data;
  },

  markRead: async (id: string): Promise<NotificationFeed> => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data.data;
  },

  markAllRead: async (): Promise<NotificationFeed> => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data.data;
  },

  subscribePush: async (payload: PushSubscriptionPayload): Promise<{ message: string }> => {
    const res = await apiClient.post('/notifications/push', payload);
    return res.data.data;
  },

  unsubscribePush: async (endpoint: string): Promise<{ message: string }> => {
    const res = await apiClient.delete('/notifications/push', { data: { endpoint } });
    return res.data.data;
  },

  /** Clé publique VAPID, ou `null` si le push n'est pas configuré côté serveur. */
  pushConfig: async (): Promise<{ enabled: boolean; publicKey: string | null }> => {
    const res = await apiClient.get('/notifications/push/config');
    return res.data.data;
  },
};
