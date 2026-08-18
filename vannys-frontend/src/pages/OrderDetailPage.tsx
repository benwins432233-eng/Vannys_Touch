import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, Package, MapPin, Truck, Phone } from 'lucide-react';
import { useCancelOrder, useOrder } from '@/hooks/use-orders';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { formatPrice, formatDateTime } from '@/utils';
import {
  Button,
  Card,
  Dialog,
  ErrorState,
  LinkButton,
  Skeleton,
  TextareaField,
} from '@/components/ui';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrder(id!);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (isLoading) {
    return (
      <div className="section page-container max-w-3xl" role="status" aria-busy="true">
        <span className="sr-only">Chargement de la commande</span>
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="section page-container max-w-3xl">
        <ErrorState
          title="Commande introuvable"
          description="Cette commande n'existe pas ou n'est plus accessible depuis votre compte."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="section">
      <div className="page-container max-w-3xl">
        <LinkButton to="/orders" variant="ghost" size="sm" className="mb-8 -ml-3">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Mes commandes
        </LinkButton>

        {/* En-tête */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Commande {order.reference}</h1>
            <p className="text-sm text-muted-foreground mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="space-y-5">
          {/* Suivi */}
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-5">Suivi de votre commande</h2>
            <OrderTimeline status={order.status} history={order.statusHistory} />
          </Card>
          {/* Articles */}
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" aria-hidden="true" />
              Articles commandés
            </h2>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                    {item.productImageUrl && (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{item.productName}</p>
                    {(item.variantColor || item.variantSize) && (
                      <p className="text-sm text-muted-foreground">
                        {[item.variantColor, item.variantSize].filter(Boolean).join(' / ')}
                      </p>
                    )}
                    <div className="flex justify-between items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">
                        × {item.quantity} ({formatPrice(item.unitPrice)} / pièce)
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Totaux */}
            <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Livraison</span>
                {Number(order.shippingFee) === 0 ? (
                  <span className="text-success font-medium">Gratuite</span>
                ) : (
                  <span>{formatPrice(order.shippingFee)}</span>
                )}
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border text-foreground">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Livraison */}
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
              Adresse de livraison
            </h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{order.deliveryFullName}</p>
              <p>
                {order.deliveryDistrict}, {order.deliveryCity}
              </p>
              <p>{order.deliveryAddress}</p>
              {order.deliveryLandmark && <p>Repère : {order.deliveryLandmark}</p>}
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                {order.deliveryPhone}
              </p>
            </div>
          </Card>

          {/* Suivi */}
          {order.trackingNumber && (
            <Card className="p-5 border-accent bg-accent/10">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Truck className="w-4 h-4 text-primary" aria-hidden="true" />
                Numéro de suivi : {order.trackingNumber}
              </p>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground mb-2">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </Card>
          )}

          {/* Annulation — proposée seulement quand le serveur l'autorise, pour
              ne jamais offrir un geste qui finirait en erreur. */}
          {order.canCancel && (
            <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">Annuler cette commande</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Possible tant que la préparation n'a pas commencé.
                </p>
              </div>
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                Annuler la commande
              </Button>
            </Card>
          )}
        </div>

        <Dialog
          open={cancelOpen}
          onClose={() => setCancelOpen(false)}
          title="Annuler la commande"
          description={`La commande ${order.reference} sera annulée et les articles remis en vente. Cette action est définitive.`}
          footer={
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setCancelOpen(false)}
              >
                Revenir
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                isLoading={isCancelling}
                onClick={() =>
                  cancelOrder(
                    { id: order.id, comment: reason || undefined },
                    { onSuccess: () => setCancelOpen(false) },
                  )
                }
              >
                Confirmer l'annulation
              </Button>
            </div>
          }
        >
          <TextareaField
            label="Motif"
            hint="Facultatif — cela nous aide à nous améliorer."
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Dialog>
      </div>
    </div>
  );
}
