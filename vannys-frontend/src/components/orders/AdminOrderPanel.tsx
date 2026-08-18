import { useState } from 'react';
import { History, Phone } from 'lucide-react';
import { useAdminOrder, useUpdateOrderStatus } from '@/hooks/use-orders';
import { formatDateTime, formatPrice, ORDER_STATUS_LABELS } from '@/utils';
import { Button, InputField, SkeletonList, TextareaField } from '@/components/ui';
import type { Order, OrderStatus } from '@/types';

interface AdminOrderPanelProps {
  /** Commande de la liste : sert d'affichage immédiat pendant le chargement du détail. */
  order: Order;
}

/**
 * Panneau déplié d'une commande côté administration.
 *
 * Les actions proposées viennent du serveur (`allowedTransitions`) et non d'une
 * liste figée dans l'interface : une commande livrée ne doit pas afficher un
 * bouton « En préparation » que l'API refusera en 400.
 */
export function AdminOrderPanel({ order }: AdminOrderPanelProps) {
  const { data: detail, isLoading } = useAdminOrder(order.id);
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [comment, setComment] = useState('');

  const transitions = detail?.allowedTransitions ?? [];
  const history = detail?.statusHistory ?? [];

  const applyStatus = (status: OrderStatus) => {
    updateStatus(
      {
        id: order.id,
        status,
        trackingNumber: trackingNumber || undefined,
        comment: comment || undefined,
      },
      {
        onSuccess: () => {
          setTrackingNumber('');
          setComment('');
        },
      },
    );
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Articles et livraison */}
      <div className="space-y-5">
        <div>
          <h3 className="font-semibold text-foreground mb-2">Articles</h3>
          <div className="space-y-1.5">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-3 text-sm text-muted-foreground"
              >
                <span>
                  {item.productName} × {item.quantity}
                  {(item.variantColor || item.variantSize) &&
                    ` (${[item.variantColor, item.variantSize].filter(Boolean).join(' / ')})`}
                </span>
                <span className="font-medium text-foreground whitespace-nowrap">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <p className="text-sm font-bold text-foreground flex justify-between">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-2">Livraison</h3>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">{order.deliveryFullName}</p>
            <p>
              {order.deliveryDistrict}, {order.deliveryCity}
            </p>
            <p>{order.deliveryAddress}</p>
            <p className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              {order.deliveryPhone}
            </p>
          </div>
        </div>
      </div>

      {/* Actions et historique */}
      <div className="space-y-5">
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm">Faire avancer la commande</h3>

          {isLoading ? (
            <SkeletonList count={1} label="Chargement des actions disponibles" />
          ) : transitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cette commande est {ORDER_STATUS_LABELS[order.status].toLowerCase()} : plus aucune
              action n'est possible.
            </p>
          ) : (
            <>
              <InputField
                label="Numéro de suivi"
                hint="Facultatif — enregistré avec le changement."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
              <TextareaField
                label="Commentaire"
                hint="Facultatif — conservé dans l'historique."
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {transitions.map((transition) => (
                  <Button
                    key={transition.status}
                    type="button"
                    size="sm"
                    variant={transition.status === 'cancelled' ? 'destructive' : 'outline'}
                    disabled={isPending}
                    onClick={() => applyStatus(transition.status)}
                  >
                    {transition.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" aria-hidden="true" />
            Historique
          </h3>
          {isLoading ? (
            <SkeletonList count={2} label="Chargement de l'historique" />
          ) : (
            <ol className="space-y-2">
              {history.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <span className="font-medium text-foreground">
                    {ORDER_STATUS_LABELS[entry.status]}
                  </span>
                  <span className="text-muted-foreground">
                    {' — '}
                    {formatDateTime(entry.createdAt)}
                    {entry.changedBy && ` · ${entry.changedBy.firstName} ${entry.changedBy.lastName}`}
                  </span>
                  {entry.comment && (
                    <p className="text-xs text-muted-foreground">{entry.comment}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
