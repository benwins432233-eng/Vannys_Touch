import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOrderStats } from '@/hooks/use-orders';
import { apiClient } from '@/api/client';
import { formatPrice, ORDER_STATUS_LABELS } from '@/utils';
import { Link } from 'react-router-dom';

export function AdminDashboardPage() {
  const { data: orderStats } = useOrderStats();

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const res = await apiClient.get('/orders/admin/all?limit=5');
      return res.data.data;
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: async () => {
      const res = await apiClient.get('/users?limit=1');
      return res.data.data;
    },
  });

  const statCards = [
    {
      label: 'Total commandes',
      value: orderStats?.total ?? '—',
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Chiffre d\'affaires',
      value: orderStats?.totalRevenue != null ? formatPrice(orderStats.totalRevenue) : '—',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'En attente',
      value: orderStats?.byStatus?.PENDING ?? 0,
      icon: Package,
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: 'Utilisateurs',
      value: userStats?.meta?.total ?? '—',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de votre boutique</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Orders by status */}
      {orderStats?.byStatus && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Commandes par statut</h2>
            <div className="space-y-3">
              {Object.entries(orderStats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((Number(count) / (orderStats.total || 1)) * 100)}%`,
                          background: 'var(--color-gold)',
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-6 text-right">{String(count)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Dernières commandes</h2>
              <Link to="/admin/orders" className="text-xs hover:underline" style={{ color: 'var(--color-gold)' }}>
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders?.data?.slice(0, 5).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{o.reference}</p>
                    <p className="text-xs text-gray-400">{o.user?.firstName} {o.user?.lastName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(o.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
