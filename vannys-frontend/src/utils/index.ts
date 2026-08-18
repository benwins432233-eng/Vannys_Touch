import type { OrderStatus } from '@/types';

/**
 * Concatène des classes conditionnelles.
 * Volontairement minimal : pas de fusion de conflits Tailwind, on écrit les
 * variantes des composants de façon à ne pas se contredire.
 */
export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

/**
 * Message d'erreur affichable, quelle que soit la forme de l'erreur reçue.
 *
 * Axios range le corps de la réponse dans `error.response.data`, mais une panne
 * réseau ou une exception JS n'ont pas cette forme : sans garde, on affichait
 * « undefined » à l'utilisateur. On reste en `unknown` plutôt qu'en `any` pour
 * que le compilateur impose ces vérifications.
 */
export const getErrorMessage = (
  error: unknown,
  fallback = "Une erreur est survenue. Veuillez réessayer.",
): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const data = (error as { response?: { data?: { message?: unknown } } }).response?.data;
    const message = data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    // NestJS renvoie un tableau de messages quand la validation d'un DTO échoue.
    if (Array.isArray(message) && typeof message[0] === 'string') return message.join(' ');
  }
  return fallback;
};

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

/** Teintes des jetons de conception — lisibles en thème clair comme sombre. */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  processing: 'bg-accent/20 text-foreground',
  shipped: 'bg-accent/20 text-foreground',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-destructive/15 text-destructive',
};

export const getDiscountPercent = (price: number, originalPrice: number): number => {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};
