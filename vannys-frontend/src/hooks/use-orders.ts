import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi, type CreateOrderPayload } from '@/api/orders.api';
import type { OrderStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cart.store';
import { CART_KEY } from './use-cart';
import { getErrorMessage } from '@/utils';

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

/** Détail administration : inclut l'historique et les transitions permises. */
export const useAdminOrder = (id?: string) =>
  useQuery({
    queryKey: [ORDERS_KEY, 'admin', 'detail', id],
    queryFn: () => ordersApi.getByIdForAdmin(id!),
    enabled: !!id,
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: (data: CreateOrderPayload) => ordersApi.create(data),
    onSuccess: (order) => {
      // Panier local vidé, panier serveur relu : la commande le consomme.
      clearCart();
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      qc.invalidateQueries({ queryKey: [CART_KEY] });
      toast.success('Commande passée avec succès !');
      navigate(`/orders/${order.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Erreur lors de la commande'));
    },
  });
};

/** Annulation par la cliente — le serveur refuse au-delà de « Confirmée ». */
export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      ordersApi.cancel(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      toast.success('Commande annulée.');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
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
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status: OrderStatus;
      trackingNumber?: string;
      comment?: string;
    }) => ordersApi.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      toast.success('Statut mis à jour !');
    },
    // Le serveur refuse une transition invalide en 400 : son message dit
    // laquelle, il vaut mieux que « Erreur lors de la mise à jour ».
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};
