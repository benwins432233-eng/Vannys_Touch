import { Fragment, useState } from 'react';
import { Search, ChevronDown, Phone } from 'lucide-react';
import { useAllOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, cn } from '@/utils';
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  SkeletonList,
  Table,
  Td,
  Tr,
} from '@/components/ui';
import type { OrderStatus, Order } from '@/types';

// Valeurs minuscules correspondant à l'enum MySQL orders_status
const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  const { data, isLoading } = useAllOrders({
    search: search || undefined,
    status: statusFilter,
    page,
  });
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();

  const handleStatusChange = (order: Order, status: OrderStatus) => {
    updateStatus({ id: order.id, status, trackingNumber: trackingInput || undefined });
    setTrackingInput('');
  };

  const toggleRow = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Commandes</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Rechercher une commande par référence ou par client"
            placeholder="Référence ou client..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-9 py-2.5 w-64"
          />
        </div>
        <select
          aria-label="Filtrer par statut"
          value={statusFilter ?? ''}
          onChange={(e) => {
            setStatusFilter((e.target.value as OrderStatus) || undefined);
            setPage(1);
          }}
          className="input w-auto py-2.5"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <SkeletonList count={5} label="Chargement des commandes" />
          </div>
        ) : data?.data.length === 0 ? (
          <EmptyState
            title="Aucune commande"
            description={
              search || statusFilter
                ? 'Aucune commande ne correspond à ces critères.'
                : 'Les commandes passées par vos clientes apparaîtront ici.'
            }
            action={
              search || statusFilter ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter(undefined);
                    setPage(1);
                  }}
                >
                  Effacer les filtres
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table
            caption="Liste des commandes de la boutique"
            columns={['Référence', 'Client', 'Date', 'Statut', 'Total', 'Détail']}
          >
            {data?.data.map((order) => {
              const expanded = expandedId === order.id;
              const panelId = `commande-${order.id}`;

              return (
                <Fragment key={order.id}>
                  <Tr className="cursor-pointer" onClick={() => toggleRow(order.id)}>
                    <Td className="font-medium text-foreground whitespace-nowrap">
                      {order.reference}
                    </Td>
                    <Td>
                      <span className="text-foreground">
                        {order.user?.firstName} {order.user?.lastName}
                      </span>
                      <br />
                      <span className="text-xs">{order.user?.email}</span>
                    </Td>
                    <Td className="whitespace-nowrap">{formatDate(order.createdAt)}</Td>
                    <Td>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </Td>
                    <Td className="font-semibold text-foreground whitespace-nowrap">
                      {formatPrice(order.total)}
                    </Td>
                    <Td>
                      <IconButton
                        label={
                          expanded
                            ? `Masquer le détail de ${order.reference}`
                            : `Afficher le détail de ${order.reference}`
                        }
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        icon={
                          <ChevronDown
                            className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')}
                          />
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(order.id);
                        }}
                      />
                    </Td>
                  </Tr>

                  {expanded && (
                    <tr id={panelId}>
                      <td colSpan={6} className="px-4 py-4 bg-muted/60">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Articles */}
                          <div>
                            <h2 className="font-semibold text-foreground mb-2">Articles</h2>
                            <div className="space-y-1.5">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between gap-3 text-sm text-muted-foreground"
                                >
                                  <span>
                                    {item.productName} × {item.quantity}
                                    {(item.variantColor || item.variantSize) &&
                                      ` (${[item.variantColor, item.variantSize]
                                        .filter(Boolean)
                                        .join(' / ')})`}
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

                          {/* Livraison et statut */}
                          <div>
                            <h2 className="font-semibold text-foreground mb-2">Livraison</h2>
                            <div className="text-sm text-muted-foreground space-y-0.5">
                              <p className="font-medium text-foreground">
                                {order.deliveryFullName}
                              </p>
                              <p>
                                {order.deliveryDistrict}, {order.deliveryCity}
                              </p>
                              <p>{order.deliveryAddress}</p>
                              <p className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                                {order.deliveryPhone}
                              </p>
                            </div>

                            <div className="mt-4 space-y-2">
                              <h2 className="font-semibold text-foreground text-sm">
                                Changer le statut
                              </h2>
                              <input
                                type="text"
                                aria-label="Numéro de suivi"
                                placeholder="N° de suivi (optionnel)"
                                value={trackingInput}
                                onChange={(e) => setTrackingInput(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="input text-sm py-2"
                              />
                              <div className="flex flex-wrap gap-2">
                                {STATUSES.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    disabled={order.status === s || isUpdating}
                                    aria-current={order.status === s}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(order, s);
                                    }}
                                    className={cn(
                                      'px-3 py-1.5 rounded-token text-xs font-medium border transition-colors',
                                      'disabled:opacity-50 disabled:pointer-events-none',
                                      order.status === s
                                        ? 'bg-muted text-muted-foreground border-border'
                                        : 'border-border text-foreground hover:bg-accent/15 hover:border-accent',
                                    )}
                                  >
                                    {ORDER_STATUS_LABELS[s]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {data && data.meta.lastPage > 1 && (
        <div className="flex items-center justify-between gap-4 mt-5">
          <p className="text-sm text-muted-foreground">{data.meta.total} commande(s) au total</p>
          <nav className="flex items-center gap-2" aria-label="Pagination">
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
        </div>
      )}
    </div>
  );
}
