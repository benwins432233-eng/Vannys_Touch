import { orders_status } from '@prisma/client';

/**
 * Machine à états d'une commande.
 *
 * Une seule table décrit ce qui est permis : sans elle, chaque appelant
 * réinventait ses propres règles et l'administration pouvait ramener une
 * commande livrée en attente.
 *
 * `processing` garde le sens qu'il avait avant le lot L3 — « en préparation » —
 * pour ne pas avoir à renommer une valeur d'ENUM déjà stockée en base.
 */
export const ALLOWED_TRANSITIONS: Record<orders_status, orders_status[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'delivery_failed', 'cancelled'],
  delivery_failed: ['shipping', 'cancelled'],
  delivered: [],
  cancelled: [],
};

/** États depuis lesquels plus rien n'est possible. */
export const isTerminal = (status: orders_status): boolean =>
  ALLOWED_TRANSITIONS[status].length === 0;

export const allowedTransitionsFrom = (status: orders_status): orders_status[] =>
  ALLOWED_TRANSITIONS[status];

export const canTransition = (from: orders_status, to: orders_status): boolean =>
  ALLOWED_TRANSITIONS[from].includes(to);

/**
 * États où la cliente peut encore annuler elle-même.
 * Au-delà, la commande est préparée ou en route : l'annulation passe par
 * l'administration, qui sait ce qui a déjà quitté le stock.
 */
export const CLIENT_CANCELLABLE: orders_status[] = ['pending', 'confirmed'];

export const canClientCancel = (status: orders_status): boolean =>
  CLIENT_CANCELLABLE.includes(status);

/**
 * Un statut rend-il le stock au catalogue ?
 * Seule l'annulation le fait : une livraison échouée peut repartir.
 */
export const restoresStock = (status: orders_status): boolean => status === 'cancelled';

export const ORDER_STATUS_LABELS: Record<orders_status, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En préparation',
  shipping: 'En livraison',
  delivery_failed: 'Livraison échouée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

/**
 * Référence lisible : CMD-AAAAMMJJ-XXXXXX.
 *
 * Le suffixe est tiré au sort plutôt que dérivé d'un `count() + 1` : deux
 * commandes passées dans la même seconde recevaient jusqu'ici la même
 * référence, et l'insertion échouait sur la contrainte d'unicité.
 */
export const buildOrderReference = (date: Date, randomSuffix: string): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `CMD-${yyyy}${mm}${dd}-${randomSuffix.toUpperCase().padStart(6, '0').slice(0, 6)}`;
};
