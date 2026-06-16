import type { OrderStatus } from '@/types';

export const formatPrice = (value: number | string): string => {
  return Number(value).toLocaleString('fr-FR') + ' FCFA';
};

// Convertit n'importe quel format de date en objet Date valide :
// - string ISO "2026-06-16T09:13:11.717Z"
// - timestamp numérique en ms : 1718531591717
// - timestamp numérique en s  : 1718531591  (Unix < 10^10)
// - bigint sérialisé en string : "1718531591717"
// - objet Date natif
const toDate = (date: string | number | Date): Date => {
  if (date instanceof Date) return date;

  const num = Number(date);
  if (!isNaN(num) && num > 0) {
    // Timestamp en secondes (Unix standard) → convertir en ms
    const ms = num < 1e10 ? num * 1000 : num;
    return new Date(ms);
  }

  // String ISO ou autre format reconnu par Date
  const d = new Date(date as string);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

export const formatDate = (date: string | number | Date): string => {
  return toDate(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | number | Date): string => {
  return toDate(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  processing: 'En traitement',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const getDiscountPercent = (price: number, originalPrice: number): number => {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};
