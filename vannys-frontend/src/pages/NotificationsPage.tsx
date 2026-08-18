import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, BellRing, CheckCheck, Package, TriangleAlert } from 'lucide-react';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/use-notifications';
import { usePush } from '@/hooks/use-push';
import { cn, formatDateTime } from '@/utils';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  SkeletonList,
} from '@/components/ui';
import type { AppNotification } from '@/types';

/** Une icône par famille de notification, pour distinguer d'un coup d'œil. */
const iconFor = (type: string) => {
  if (type === 'low_stock') return TriangleAlert;
  return Package;
};

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useNotifications(page);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();
  const push = usePush();
  const navigate = useNavigate();

  /** Ouvrir une notification la marque lue et emmène à la ressource. */
  const open = (notification: AppNotification) => {
    if (!notification.readAt) markRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="section">
      <div className="page-container max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {!!data?.unreadCount && (
            <Button
              variant="outline"
              size="sm"
              isLoading={isMarkingAll}
              onClick={() => markAllRead()}
              leftIcon={<CheckCheck className="w-4 h-4" aria-hidden="true" />}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Push — visible seulement quand il a une chance de fonctionner */}
        <Card className="p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {push.subscribed ? (
              <BellRing className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">Alertes sur cet appareil</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {push.unavailableReason ??
                  (push.subscribed
                    ? 'Vous recevez les alertes même quand la boutique est fermée.'
                    : 'Soyez prévenue du suivi de vos commandes sans ouvrir la boutique.')}
              </p>
            </div>
          </div>
          {push.available && (
            <Button
              variant="outline"
              size="sm"
              isLoading={push.isBusy}
              onClick={() => (push.subscribed ? push.unsubscribe() : push.subscribe())}
            >
              {push.subscribed ? 'Désactiver' : 'Activer'}
            </Button>
          )}
        </Card>

        {isLoading ? (
          <SkeletonList count={4} label="Chargement de vos notifications" />
        ) : isError ? (
          <ErrorState
            title="Vos notifications n'ont pas pu être chargées"
            onRetry={() => refetch()}
          />
        ) : !data?.items.length ? (
          <EmptyState
            icon={<Bell className="w-10 h-10" />}
            title="Aucune notification"
            description="Le suivi de vos commandes apparaîtra ici."
          />
        ) : (
          <ul className="space-y-3">
            {data.items.map((notification) => {
              const Icon = iconFor(notification.type);
              const unread = !notification.readAt;

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => open(notification)}
                    className={cn(
                      'w-full text-left card p-4 flex gap-4 transition-shadow hover:shadow-card-hover',
                      unread && 'border-accent bg-accent/5',
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-token shrink-0 h-fit',
                        unread ? 'bg-accent/20 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-foreground', unread ? 'font-semibold' : 'font-medium')}>
                        {notification.title}
                        {unread && <span className="sr-only"> — non lue</span>}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {data && data.meta.lastPage > 1 && (
          <nav className="flex justify-center items-center gap-2 mt-6" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <span className="px-3 text-sm text-muted-foreground" aria-live="polite">
              Page {page} sur {data.meta.lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}
