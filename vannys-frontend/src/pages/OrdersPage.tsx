import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { useMyOrders } from '@/hooks/use-orders';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatPrice, formatDate } from '@/utils';
import { EmptyState, ErrorState, LinkButton, SkeletonList } from '@/components/ui';

export function OrdersPage() {
  const { data, isLoading, isError, refetch } = useMyOrders();

  return (
    <div className="section">
      <div className="page-container max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-8">Mes commandes</h1>

        {isLoading ? (
          <SkeletonList count={3} label="Chargement de vos commandes" />
        ) : isError ? (
          <ErrorState
            title="Vos commandes n'ont pas pu être chargées"
            onRetry={() => refetch()}
          />
        ) : data?.data.length === 0 ? (
          <EmptyState
            icon={<Package className="w-10 h-10" />}
            title="Aucune commande pour l'instant"
            description="Vos achats apparaîtront ici dès votre première commande."
            action={
              <LinkButton to="/products">Commencer mes achats</LinkButton>
            }
          />
        ) : (
          <div className="space-y-4">
            {data?.data.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="card p-5 flex items-center gap-4 transition-shadow hover:shadow-card-hover group"
              >
                <div className="p-3 rounded-xl bg-accent/15 shrink-0">
                  <Package className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-foreground">{order.reference}</span>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                    <span>{formatDate(order.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{order.items.length} article(s)</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-foreground">{formatPrice(order.total)}</span>
                  </div>
                </div>
                <ChevronRight
                  className="w-4 h-4 text-muted-foreground transition-colors group-hover:text-foreground shrink-0"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
