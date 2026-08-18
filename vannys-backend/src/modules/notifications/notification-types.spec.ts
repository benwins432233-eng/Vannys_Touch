import { orders_status } from '@prisma/client';
import { ALLOWED_TRANSITIONS } from '../orders/order-status';
import {
  adminNewOrder,
  lowStock,
  NOTIFICATION_TYPES,
  orderCreated,
  orderStatusChanged,
} from './notification-types';

const ALL_STATUSES = Object.keys(ALLOWED_TRANSITIONS) as orders_status[];

describe('orderCreated', () => {
  it('pointe vers la commande concernée', () => {
    const content = orderCreated('CMD-20260818-A1B2C3', '42');
    expect(content.type).toBe(NOTIFICATION_TYPES.orderCreated);
    expect(content.link).toBe('/orders/42');
    expect(content.message).toContain('CMD-20260818-A1B2C3');
  });

  it('ne renvoie qu’un chemin interne', () => {
    // Une URL absolue figerait le domaine de développement dans la base.
    expect(orderCreated('CMD-1', '1').link.startsWith('/')).toBe(true);
  });
});

describe('orderStatusChanged', () => {
  it('produit un message pour chaque état, sans trou', () => {
    // Un état sans message afficherait « undefined » à la cliente.
    for (const status of ALL_STATUSES) {
      const content = orderStatusChanged('CMD-1', '1', status);
      expect(typeof content.message).toBe('string');
      expect(content.message.length).toBeGreaterThan(10);
      expect(content.title).toContain('CMD-1');
    }
  });

  it('distingue une annulation d’un simple changement d’état', () => {
    expect(orderStatusChanged('CMD-1', '1', 'cancelled').type).toBe(
      NOTIFICATION_TYPES.orderCancelled,
    );
    expect(orderStatusChanged('CMD-1', '1', 'shipping').type).toBe(
      NOTIFICATION_TYPES.orderStatusChanged,
    );
  });

  it('annonce la remise en vente quand la commande est annulée', () => {
    expect(orderStatusChanged('CMD-1', '1', 'cancelled').message).toContain('remis en vente');
  });
});

describe('lowStock', () => {
  it('dit « épuisé » plutôt que « il reste 0 »', () => {
    expect(lowStock('Robe', 0, '7').message).toContain('épuisé');
    expect(lowStock('Robe', 0, '7').message).not.toContain('0 article');
  });

  it('nomme la quantité restante', () => {
    expect(lowStock('Robe', 2, '7').message).toContain('2 article');
  });

  it('renvoie vers la fiche produit côté administration', () => {
    expect(lowStock('Robe', 2, '7').link).toBe('/admin/products?highlight=7');
  });
});

describe('adminNewOrder', () => {
  it('nomme la cliente et le montant', () => {
    const content = adminNewOrder('CMD-1', '1', 'Marie Dupont', '25 000 FCFA');
    expect(content.message).toContain('Marie Dupont');
    expect(content.message).toContain('25 000 FCFA');
    expect(content.link).toBe('/admin/orders');
  });
});
