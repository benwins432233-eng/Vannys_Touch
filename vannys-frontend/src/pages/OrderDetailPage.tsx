import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Package, MapPin, Truck } from 'lucide-react';
import { useOrder } from '@/hooks/use-orders';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatPrice, formatDateTime } from '@/utils';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id!);

  if (isLoading) {
    return (
      <div className="section page-container max-w-3xl animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-48 mb-8" />
        <div className="space-y-4">
          <div className="card p-6 h-32" />
          <div className="card p-6 h-48" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="section">
      <div className="page-container max-w-3xl">
        <Link to="/orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ChevronLeft className="w-4 h-4" /> Mes commandes
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Commande {order.reference}</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="space-y-5">
          {/* Items */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" style={{ color: 'var(--color-gold)' }} />
              Articles commandés
            </h2>
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {item.productImageUrl && (
                      <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {(item.variantColor || item.variantSize) && (
                      <p className="text-sm text-gray-400">
                        {[item.variantColor, item.variantSize].filter(Boolean).join(' / ')}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500">× {item.quantity} ({formatPrice(item.unitPrice)} / pièce)</span>
                      <span className="font-semibold">{formatPrice(item.subtotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Livraison</span>
                {Number(order.shippingFee) === 0 ? (
                  <span className="text-green-600 font-medium">Gratuite</span>
                ) : (
                  <span>{formatPrice(order.shippingFee)}</span>
                )}
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span style={{ color: 'var(--color-gold)' }}>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: 'var(--color-gold)' }} />
              Adresse de livraison
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.deliveryFullName}</p>
              <p>{order.deliveryDistrict}, {order.deliveryCity}</p>
              <p>{order.deliveryAddress}</p>
              {order.deliveryLandmark && <p className="text-gray-400">Repère : {order.deliveryLandmark}</p>}
              <p>📞 {order.deliveryPhone}</p>
            </div>
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="card p-5 bg-blue-50 border-blue-100">
              <div className="flex items-center gap-2 text-blue-800">
                <Truck className="w-4 h-4" />
                <span className="font-medium text-sm">Numéro de suivi : {order.trackingNumber}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
