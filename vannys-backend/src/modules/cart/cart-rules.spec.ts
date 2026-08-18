import { clampQuantity, lineStatus, MAX_QUANTITY_PER_LINE } from './cart-rules';

const sellable = (stock: number) => ({ stock, variantActive: true, productActive: true });

describe('clampQuantity', () => {
  it('accepte une quantité disponible', () => {
    expect(clampQuantity(3, sellable(10))).toBe(3);
  });

  it('plafonne au stock restant plutôt que de refuser', () => {
    expect(clampQuantity(9, sellable(4))).toBe(4);
  });

  it('plafonne à 20 par ligne même si le stock suit', () => {
    expect(clampQuantity(50, sellable(500))).toBe(MAX_QUANTITY_PER_LINE);
  });

  it('retourne zéro sur une variante désactivée', () => {
    expect(clampQuantity(2, { stock: 10, variantActive: false, productActive: true })).toBe(0);
  });

  it('retourne zéro sur un produit désactivé, même si la variante a du stock', () => {
    expect(clampQuantity(2, { stock: 10, variantActive: true, productActive: false })).toBe(0);
  });

  it('retourne zéro quand le stock est épuisé', () => {
    expect(clampQuantity(1, sellable(0))).toBe(0);
  });
});

describe('lineStatus', () => {
  it('laisse passer une ligne servie intégralement', () => {
    expect(lineStatus(2, sellable(5))).toEqual({ effectiveQuantity: 2, available: true });
  });

  it('signale un stock devenu insuffisant sans modifier le panier', () => {
    // Le stock a baissé depuis l'ajout : on le dit, on ne corrige pas en douce.
    const status = lineStatus(5, sellable(2));
    expect(status.available).toBe(false);
    expect(status.effectiveQuantity).toBe(2);
    expect(status.alert).toContain('2 article');
  });

  it('ne compte rien dans les totaux quand l’article est épuisé', () => {
    const status = lineStatus(3, sellable(0));
    expect(status.effectiveQuantity).toBe(0);
    expect(status.available).toBe(false);
  });

  it('signale un article retiré de la vente', () => {
    const status = lineStatus(1, { stock: 5, variantActive: false, productActive: true });
    expect(status.available).toBe(false);
    expect(status.alert).toContain('plus proposé');
  });

  it('signale un dépassement du plafond par ligne', () => {
    const status = lineStatus(25, sellable(100));
    expect(status.available).toBe(false);
    expect(status.effectiveQuantity).toBe(MAX_QUANTITY_PER_LINE);
  });
});
