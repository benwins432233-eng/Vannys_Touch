import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { useAuthStore } from '@/store/auth.store';
import type { NotificationFeed } from '@/types';

export const NOTIFICATIONS_KEY = 'notifications';

/**
 * Fil de notifications du compte connecté.
 *
 * Rafraîchi périodiquement plutôt que poussé : le push web n'est pas garanti
 * (permission refusée, VAPID non configuré, iOS sans PWA installée), et la
 * pastille doit rester juste dans tous les cas.
 */
export const useNotifications = (page = 1) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, page],
    queryFn: () => notificationsApi.list(page),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    // Inutile de solliciter le serveur quand l'onglet est en arrière-plan.
    refetchIntervalInBackground: false,
  });
};

/** Compteur seul, pour la cloche de l'en-tête. */
export const useUnreadCount = (): number => {
  const { data } = useNotifications();
  return data?.unreadCount ?? 0;
};

const useFeedMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<NotificationFeed>,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    // La réponse contient le fil à jour : on écrit le cache plutôt que de
    // relancer une requête pour la même information.
    onSuccess: (feed) => {
      qc.setQueryData([NOTIFICATIONS_KEY, 1], feed);
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
};

export const useMarkNotificationRead = () =>
  useFeedMutation((id: string) => notificationsApi.markRead(id));

export const useMarkAllNotificationsRead = () =>
  useFeedMutation((_: void) => notificationsApi.markAllRead());
