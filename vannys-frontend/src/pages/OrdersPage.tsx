import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { useMyOrders } from '@/hooks/use-orders';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatPrice, formatDate } from '@/utils';

export function OrdersPage() {
  const { data, isLoading } = useMyOrders();

  return (
    <div className="section">
      <div className="page-container max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Mes commandes</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-medium text-gray-600">Aucune commande pour l'instant</p>
            <Link to="/products" className="btn-primary mt-6 inline-flex">
              Commencer mes achats
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.data.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow group"
              >
                <div className="p-3 rounded-xl bg-amber-50">
                  <Package className="w-5 h-5" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-900">{order.reference}</span>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                    <span>{formatDate(order.createdAt)}</span>
                    <span>·</span>
                    <span>{order.items.length} article(s)</span>
                    <span>·</span>
                    <span className="font-medium text-gray-900">{formatPrice(order.total)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
