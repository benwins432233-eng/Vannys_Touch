import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi, type CreateOrderPayload } from '@/api/orders.api';
import type { OrderStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cart.store';

export const ORDERS_KEY = 'orders';

export const useMyOrders = (page = 1) =>
  useQuery({
    queryKey: [ORDERS_KEY, 'my', page],
    queryFn: () => ordersApi.getMyOrders(page),
  });

export const useOrder = (id: string) =>
  useQuery({
    queryKey: [ORDERS_KEY, id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: (data: CreateOrderPayload) => ordersApi.create(data),
    onSuccess: (order) => {
      clearCart();
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      toast.success('Commande passée avec succès !');
      navigate(`/orders/${order.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la commande');
    },
  });
};

// Admin
export const useAllOrders = (filters?: {
  status?: OrderStatus;
  search?: string;
  page?: number;
}) =>
  useQuery({
    queryKey: [ORDERS_KEY, 'admin', filters],
    queryFn: () => ordersApi.getAll(filters),
  });

export const useOrderStats = () =>
  useQuery({
    queryKey: [ORDERS_KEY, 'stats'],
    queryFn: ordersApi.getStats,
    staleTime: 60 * 1000,
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: OrderStatus; trackingNumber?: string }) =>
      ordersApi.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      toast.success('Statut mis à jour !');
    },
    onError: () => toast.error('Erreur lors de la mise à jour du statut'),
  });
};
