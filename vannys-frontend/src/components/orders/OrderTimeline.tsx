import { Check, Clock, XCircle, AlertTriangle } from 'lucide-react';
import type { OrderStatus, OrderStatusHistoryEntry } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_TIMELINE, cn, formatDateTime } from '@/utils';

interface OrderTimelineProps {
  status: OrderStatus;
  history?: OrderStatusHistoryEntry[];
}

/** Date à laquelle une étape a été franchie, si elle l'a été. */
const reachedAt = (history: OrderStatusHistoryEntry[], step: OrderStatus): string | undefined =>
  history.find((h) => h.status === step)?.createdAt;

/**
 * Frise de suivi d'une commande.
 *
 * Les étapes viennent d'un parcours fixe, pas de l'historique : une commande
 * qui vient d'être passée doit montrer ce qui l'attend, pas seulement ce qui
 * s'est produit. L'historique n'apporte que les dates.
 *
 * Une annulation ou un échec de livraison sortent du parcours : les afficher
 * comme une étape de plus laisserait croire à une progression normale.
 */
export function OrderTimeline({ status, history = [] }: OrderTimelineProps) {
  if (status === 'cancelled') {
    const at = reachedAt(history, 'cancelled');
    const reason = history.find((h) => h.status === 'cancelled')?.comment;
    return (
      <div
        className="flex items-start gap-3 p-4 rounded-token bg-destructive/10 text-foreground"
        role="status"
      >
        <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold">Commande annulée</p>
          {at && <p className="text-sm text-muted-foreground mt-0.5">{formatDateTime(at)}</p>}
          {reason && <p className="text-sm text-muted-foreground mt-1">{reason}</p>}
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_TIMELINE.indexOf(status);
  const failed = status === 'delivery_failed';
  // Une livraison échouée reste positionnée à l'étape « En livraison ».
  const activeIndex = failed ? ORDER_TIMELINE.indexOf('shipping') : currentIndex;

  return (
    <div>
      <ol className="flex flex-col sm:flex-row gap-4 sm:gap-0">
        {ORDER_TIMELINE.map((step, index) => {
          const done = index < activeIndex;
          const current = index === activeIndex;
          const at = reachedAt(history, step);

          return (
            <li key={step} className="flex sm:flex-col sm:flex-1 gap-3 sm:gap-2 sm:items-center">
              <div className="flex sm:w-full items-center">
                {/* Trait de liaison, masqué avant la première étape */}
                <span
                  className={cn(
                    'hidden sm:block h-0.5 flex-1',
                    index === 0 && 'invisible',
                    done || current ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
                    done && 'bg-primary border-primary text-primary-foreground',
                    current && !failed && 'border-primary text-primary',
                    current && failed && 'border-destructive text-destructive',
                    !done && !current && 'border-border text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {done ? (
                    <Check className="w-4 h-4" />
                  ) : current && failed ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </span>
                <span
                  className={cn(
                    'hidden sm:block h-0.5 flex-1',
                    index === ORDER_TIMELINE.length - 1 && 'invisible',
                    done ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden="true"
                />
              </div>

              <div className="sm:text-center">
                <p
                  className={cn(
                    'text-sm font-medium',
                    done || current ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {ORDER_STATUS_LABELS[step]}
                  {current && <span className="sr-only"> — étape en cours</span>}
                </p>
                {at && (
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(at)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {failed && (
        <p
          className="mt-4 p-3 rounded-token bg-destructive/10 text-sm text-foreground"
          role="status"
        >
          La livraison n'a pas abouti. Notre équipe vous recontacte pour convenir d'un nouveau
          passage.
        </p>
      )}
    </div>
  );
}
