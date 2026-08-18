import { orders_status } from '@prisma/client';
import {
  ALLOWED_TRANSITIONS,
  allowedTransitionsFrom,
  buildOrderReference,
  canClientCancel,
  canTransition,
  isTerminal,
  restoresStock,
} from './order-status';

const ALL_STATUSES = Object.keys(ALLOWED_TRANSITIONS) as orders_status[];

describe('machine à états des commandes', () => {
  it('décrit une transition pour chaque état, sans trou', () => {
    // Un état absent de la table ferait planter `canTransition` à l'exécution.
    for (const status of ALL_STATUSES) {
      expect(Array.isArray(ALLOWED_TRANSITIONS[status])).toBe(true);
    }
    expect(ALL_STATUSES).toHaveLength(7);
  });

  it('suit le parcours nominal jusqu’à la livraison', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'processing')).toBe(true);
    expect(canTransition('processing', 'shipping')).toBe(true);
    expect(canTransition('shipping', 'delivered')).toBe(true);
  });

  it('autorise une nouvelle tentative après un échec de livraison', () => {
    expect(canTransition('shipping', 'delivery_failed')).toBe(true);
    expect(canTransition('delivery_failed', 'shipping')).toBe(true);
  });

  it('permet d’annuler tant que la commande n’est pas livrée', () => {
    for (const status of ['pending', 'confirmed', 'processing', 'shipping', 'delivery_failed'] as orders_status[]) {
      expect(canTransition(status, 'cancelled')).toBe(true);
    }
  });

  it('refuse de revenir en arrière', () => {
    expect(canTransition('delivered', 'shipping')).toBe(false);
    expect(canTransition('processing', 'pending')).toBe(false);
    expect(canTransition('shipping', 'confirmed')).toBe(false);
  });

  it('refuse de sauter une étape', () => {
    expect(canTransition('pending', 'shipping')).toBe(false);
    expect(canTransition('pending', 'delivered')).toBe(false);
    expect(canTransition('confirmed', 'delivered')).toBe(false);
  });

  it('traite « livrée » et « annulée » comme terminaux', () => {
    expect(isTerminal('delivered')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
    expect(allowedTransitionsFrom('delivered')).toEqual([]);
    // Une commande annulée ne se ranime pas : elle se recommande.
    expect(canTransition('cancelled', 'pending')).toBe(false);
  });

  it('n’autorise jamais un état à se transitionner vers lui-même', () => {
    for (const status of ALL_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });
});

describe('annulation par la cliente', () => {
  it('est possible avant la préparation', () => {
    expect(canClientCancel('pending')).toBe(true);
    expect(canClientCancel('confirmed')).toBe(true);
  });

  it('est refusée dès que la commande est préparée ou partie', () => {
    // Au-delà, seule l'administration sait ce qui a déjà quitté le stock.
    expect(canClientCancel('processing')).toBe(false);
    expect(canClientCancel('shipping')).toBe(false);
    expect(canClientCancel('delivered')).toBe(false);
    expect(canClientCancel('cancelled')).toBe(false);
  });
});

describe('restitution du stock', () => {
  it('n’a lieu que sur une annulation', () => {
    expect(restoresStock('cancelled')).toBe(true);
    // Une livraison échouée peut repartir : les articles restent engagés.
    expect(restoresStock('delivery_failed')).toBe(false);
    expect(restoresStock('delivered')).toBe(false);
  });
});

describe('buildOrderReference', () => {
  it('produit le format CMD-AAAAMMJJ-XXXXXX', () => {
    expect(buildOrderReference(new Date(2026, 7, 18), 'a1b2c3')).toBe('CMD-20260818-A1B2C3');
  });

  it('complète un suffixe trop court et coupe un suffixe trop long', () => {
    expect(buildOrderReference(new Date(2026, 0, 5), 'x9')).toBe('CMD-20260105-0000X9');
    expect(buildOrderReference(new Date(2026, 0, 5), 'abcdefgh')).toBe('CMD-20260105-ABCDEF');
  });

  it('tient dans la colonne VARCHAR(30)', () => {
    expect(buildOrderReference(new Date(2026, 11, 31), 'zzzzzz').length).toBeLessThanOrEqual(30);
  });
});
