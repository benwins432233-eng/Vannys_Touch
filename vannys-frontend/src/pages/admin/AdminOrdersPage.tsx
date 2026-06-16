import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useAllOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from '@/utils';
import type { OrderStatus, Order } from '@/types';

// Valeurs minuscules correspondant à l'enum MySQL orders_status
const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  const { data, isLoading } = useAllOrders({ search: search || undefined, status: statusFilter, page });
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();

  const handleStatusChange = (order: Order, status: OrderStatus) => {
    updateStatus({ id: order.id, status, trackingNumber: trackingInput || undefined });
    setTrackingInput('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Commandes</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Référence ou client..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none w-64"
          />
        </div>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => { setStatusFilter((e.target.value as OrderStatus) || undefined); setPage(1); }}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2.5 bg-white focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Référence', 'Client', 'Date', 'Statut', 'Total', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.data.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{order.reference}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.user?.firstName} {order.user?.lastName}
                        <br />
                        <span className="text-xs text-gray-400">{order.user?.email}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">
                        <button className="text-gray-400 hover:text-gray-700">
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </tr>

                    {expandedId === order.id && (
                      <tr key={`${order.id}-expanded`}>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Items */}
                            <div>
                              <h3 className="font-semibold text-gray-700 mb-2">Articles</h3>
                              <div className="space-y-1.5">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                                    <span>{item.productName} × {item.quantity}
                                      {item.variantColor && ` (${item.variantColor}`}
                                      {item.variantSize && `/${item.variantSize})`}
                                      {item.variantColor && !item.variantSize && ')'}
                                    </span>
                                    <span className="font-medium">{formatPrice(item.subtotal)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 pt-2 border-t border-gray-200">
                                <p className="text-sm font-bold text-gray-900 flex justify-between">
                                  <span>Total</span><span>{formatPrice(order.total)}</span>
                                </p>
                              </div>
                            </div>

                            {/* Delivery + update */}
                            <div>
                              <h3 className="font-semibold text-gray-700 mb-2">Livraison</h3>
                              <div className="text-sm text-gray-600 space-y-0.5">
                                <p className="font-medium">{order.deliveryFullName}</p>
                                <p>{order.deliveryDistrict}, {order.deliveryCity}</p>
                                <p>{order.deliveryAddress}</p>
                                <p>📞 {order.deliveryPhone}</p>
                              </div>

                              <div className="mt-4 space-y-2">
                                <h3 className="font-semibold text-gray-700 text-sm">Changer le statut</h3>
                                <input
                                  type="text"
                                  placeholder="N° de suivi (optionnel)"
                                  value={trackingInput}
                                  onChange={(e) => setTrackingInput(e.target.value)}
                                  className="input text-sm py-2"
                                />
                                <div className="flex flex-wrap gap-2">
                                  {STATUSES.map((s) => (
                                    <button
                                      key={s}
                                      disabled={order.status === s || isUpdating}
                                      onClick={(e) => { e.stopPropagation(); handleStatusChange(order, s); }}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${
                                        order.status === s
                                          ? 'bg-gray-200 text-gray-600 border-gray-200'
                                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                      }`}
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
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.meta.lastPage > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-gray-500">
            {data.meta.total} commande(s) au total
          </p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">
              Précédent
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">
              {page} / {data.meta.lastPage}
            </span>
            <button disabled={page >= data.meta.lastPage} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
