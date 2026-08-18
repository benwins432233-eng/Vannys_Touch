/**
 * Règles du panier, isolées du service pour être testables sans base.
 * Elles décident de quantités et de montants : exactement ce qu'une régression
 * casse en silence.
 */

/** Plafond par ligne, indépendamment du stock : au-delà, c'est du gros. */
export const MAX_QUANTITY_PER_LINE = 20;

export interface LineStock {
  stock: number;
  variantActive: boolean;
  productActive: boolean;
}

/**
 * Quantité réellement enregistrable pour une ligne.
 * Retourne 0 quand l'article n'est plus vendable : à l'appelant de refuser.
 */
export const clampQuantity = (requested: number, { stock, variantActive, productActive }: LineStock): number => {
  if (!variantActive || !productActive) return 0;
  return Math.max(0, Math.min(requested, stock, MAX_QUANTITY_PER_LINE));
};

export interface LineStatus {
  /** Quantité qui compte dans les totaux : jamais plus que le stock restant. */
  effectiveQuantity: number;
  available: boolean;
  alert?: string;
}

/**
 * État d'une ligne au moment de l'affichage.
 *
 * Le stock a pu baisser depuis l'ajout : on ne modifie pas le panier en douce
 * pendant une lecture, on le dit. Les totaux, eux, ne comptent que ce qui peut
 * réellement partir.
 */
export const lineStatus = (quantity: number, stock: LineStock): LineStatus => {
  if (!stock.variantActive || !stock.productActive) {
    return {
      effectiveQuantity: 0,
      available: false,
      alert: "Cet article n'est plus proposé à la vente.",
    };
  }

  if (stock.stock <= 0) {
    return { effectiveQuantity: 0, available: false, alert: 'Cet article est épuisé.' };
  }

  if (quantity > stock.stock) {
    return {
      effectiveQuantity: stock.stock,
      available: false,
      alert: `Il ne reste que ${stock.stock} article(s) : ajustez la quantité pour commander.`,
    };
  }

  if (quantity > MAX_QUANTITY_PER_LINE) {
    return {
      effectiveQuantity: MAX_QUANTITY_PER_LINE,
      available: false,
      alert: `${MAX_QUANTITY_PER_LINE} articles maximum par ligne.`,
    };
  }

  return { effectiveQuantity: quantity, available: true };
};
