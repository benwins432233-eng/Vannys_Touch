import { orders_status } from '@prisma/client';
import { ORDER_STATUS_LABELS } from '../orders/order-status';

/**
 * Contenu des notifications, isolé du service pour être testable et pour que
 * les libellés vus par les clientes vivent en un seul endroit.
 */

export const NOTIFICATION_TYPES = {
  orderCreated: 'order_created',
  orderStatusChanged: 'order_status_changed',
  orderCancelled: 'order_cancelled',
  lowStock: 'low_stock',
  adminNewOrder: 'admin_new_order',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export interface NotificationContent {
  type: NotificationType;
  title: string;
  message: string;
  /** Chemin interne : le domaine change entre développement et production. */
  link: string;
}

export const orderCreated = (reference: string, orderId: string): NotificationContent => ({
  type: NOTIFICATION_TYPES.orderCreated,
  title: 'Commande enregistrée',
  message: `Votre commande ${reference} a bien été enregistrée. Nous la confirmons très vite.`,
  link: `/orders/${orderId}`,
});

export const orderStatusChanged = (
  reference: string,
  orderId: string,
  status: orders_status,
): NotificationContent => ({
  type:
    status === 'cancelled'
      ? NOTIFICATION_TYPES.orderCancelled
      : NOTIFICATION_TYPES.orderStatusChanged,
  title: `Commande ${reference} — ${ORDER_STATUS_LABELS[status]}`,
  message: STATUS_MESSAGES[status],
  link: `/orders/${orderId}`,
});

/** Un statut n'est pas une phrase : chaque état dit ce qu'il implique. */
const STATUS_MESSAGES: Record<orders_status, string> = {
  pending: 'Votre commande est enregistrée et attend notre confirmation.',
  confirmed: 'Votre commande est confirmée. Nous préparons vos articles.',
  processing: 'Vos articles sont en cours de préparation.',
  shipping: 'Votre commande est en route. Notre livreur vous contactera.',
  delivery_failed:
    "La livraison n'a pas abouti. Nous vous recontactons pour convenir d'un nouveau passage.",
  delivered: 'Votre commande a été livrée. Merci de votre confiance !',
  cancelled: 'Votre commande a été annulée. Les articles sont remis en vente.',
};

export const adminNewOrder = (
  reference: string,
  orderId: string,
  customerName: string,
  total: string,
): NotificationContent => ({
  type: NOTIFICATION_TYPES.adminNewOrder,
  title: `Nouvelle commande ${reference}`,
  message: `${customerName} vient de commander pour ${total}.`,
  link: `/admin/orders`,
});

export const lowStock = (
  productName: string,
  remaining: number,
  productId: string,
): NotificationContent => ({
  type: NOTIFICATION_TYPES.lowStock,
  title: 'Stock faible',
  message:
    remaining === 0
      ? `« ${productName} » est épuisé.`
      : `Il ne reste que ${remaining} article(s) de « ${productName} ».`,
  link: `/admin/products?highlight=${productId}`,
});
