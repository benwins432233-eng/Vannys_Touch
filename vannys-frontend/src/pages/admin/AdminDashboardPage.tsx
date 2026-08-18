import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOrderStats } from '@/hooks/use-orders';
import { apiClient } from '@/api/client';
import { formatPrice, ORDER_STATUS_LABELS } from '@/utils';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
import type { Order, PaginatedResponse } from '@/types';

export function AdminDashboardPage() {
  const { data: orderStats } = useOrderStats();

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<Order> }>(
        '/orders/admin/all?limit=5',
      );
      return res.data.data;
    },
  });

  // Seule la pagination nous intéresse ici : `total` donne le nombre de comptes.
  const { data: userStats } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { meta: { total: number } } }>('/users?limit=1');
      return res.data.data;
    },
  });

  const statCards = [
    {
      label: 'Total commandes',
      value: orderStats?.total ?? '—',
      icon: ShoppingBag,
      tone: 'bg-accent/15 text-primary',
    },
    {
      label: 'Chiffre d\'affaires',
      value: orderStats?.totalRevenue != null ? formatPrice(orderStats.totalRevenue) : '—',
      icon: TrendingUp,
      tone: 'bg-success/15 text-success',
    },
    {
      label: 'En attente',
      value: orderStats?.byStatus?.PENDING ?? 0,
      icon: Package,
      tone: 'bg-warning/15 text-warning',
    },
    {
      label: 'Utilisateurs',
      value: userStats?.meta?.total ?? '—',
      icon: Users,
      tone: 'bg-foreground/10 text-foreground',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de votre boutique</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Orders by status */}
      {orderStats?.byStatus && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">Commandes par statut</h2>
            <div className="space-y-3">
              {Object.entries(orderStats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.round((Number(count) / (orderStats.total || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-6 text-right text-foreground">
                      {String(count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Dernières commandes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Dernières commandes</h2>
              <Link to="/admin/orders" className="text-xs text-primary hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders?.data?.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{o.reference}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.user?.firstName} {o.user?.lastName}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground shrink-0">
                    {formatPrice(o.total)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
